import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ActionType, Modules } from '../../../core/enums/value.enum';
import { Job } from '../../../entities/job.entity';
import {
  assertSalaryRange,
  duplicateJobError,
  isDuplicateEntry,
} from '../../../utils/job-rules';
import { buildResponse } from '../../../utils/response-messages.util';
import { CreateJobCommand } from '../impl/create-job.command';

@CommandHandler(CreateJobCommand)
export class CreateJobHandler implements ICommandHandler<CreateJobCommand> {
  private readonly logger = new Logger(CreateJobHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: CreateJobCommand) {
    const { body, user } = command;

    // 1. Business rule: min salary can't be more than max salary
    assertSalaryRange(body.salaryMin, body.salaryMax);

    // 2. Everything inside transaction() is one unit:
    //    if any query throws, MySQL rolls all of it back
    const saved = await this.dataSource.transaction(async (manager) => {
      const jobRepository = manager.getRepository(Job);
      try {
        return await jobRepository.save(
          jobRepository.create({
            ...body,
            createdBy: user.id,
            updatedBy: user.id,
          }),
        );
      } catch (err) {
        if (isDuplicateEntry(err)) throw duplicateJobError();
        throw err;
      }
    });

    this.logger.log(`Job ${saved.id} created by user ${user.id}`);
    return buildResponse(Modules.Job, saved.id, ActionType.Created);
  }
}
