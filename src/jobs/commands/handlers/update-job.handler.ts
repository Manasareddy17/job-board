import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ActionType, Modules } from '../../../core/enums/value.enum';
import { Job } from '../../../entities/job.entity';
import {
  assertSalaryRange,
  duplicateJobError,
  isDuplicateEntry,
  jobNotFoundError,
} from '../../../utils/job-rules';
import { buildResponse } from '../../../utils/response-messages.util';
import { UpdateJobCommand } from '../impl/update-job.command';

@CommandHandler(UpdateJobCommand)
export class UpdateJobHandler implements ICommandHandler<UpdateJobCommand> {
  private readonly logger = new Logger(UpdateJobHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: UpdateJobCommand) {
    const { body, user } = command;
    const { jobId, ...changes } = body;

    // Read + check + save run in one transaction; any failure rolls everything back
    await this.dataSource.transaction(async (manager) => {
      const jobRepository = manager.getRepository(Job);

      // 1. The job must exist. The row lock stops two updates
      //    to the same job from overwriting each other.
      const job = await jobRepository.findOne({
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw jobNotFoundError(jobId);

      // 2. Sending only one salary must still be checked against the saved other one
      assertSalaryRange(
        changes.salaryMin ?? job.salaryMin,
        changes.salaryMax ?? job.salaryMax,
      );

      // 3. Apply the changes, remembering who made them
      Object.assign(job, changes, { updatedBy: user.id });
      try {
        await jobRepository.save(job);
      } catch (err) {
        if (isDuplicateEntry(err)) throw duplicateJobError();
        throw err;
      }
    });

    this.logger.log(`Job ${jobId} updated by user ${user.id}`);
    return buildResponse(Modules.Job, jobId, ActionType.Updated);
  }
}
