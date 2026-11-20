import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ActionType, Modules } from '../../../core/enums/value.enum';
import { Job } from '../../../entities/job.entity';
import { jobNotFoundError } from '../../../utils/job-rules';
import { buildResponse } from '../../../utils/response-messages.util';
import { DeleteJobCommand } from '../impl/delete-job.command';

@CommandHandler(DeleteJobCommand)
export class DeleteJobHandler implements ICommandHandler<DeleteJobCommand> {
  private readonly logger = new Logger(DeleteJobHandler.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeleteJobCommand) {
    const { body, user } = command;
    const { jobId } = body;

    await this.dataSource.transaction(async (manager) => {
      const jobRepository = manager.getRepository(Job);

      // 1. The job must exist and not be deleted already
      //    (findOne skips soft-deleted rows, so deleting twice gives NOT_FOUND)
      const job = await jobRepository.findOne({
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job) throw jobNotFoundError(jobId);

      // 2. Soft delete: keep the row, record when and by whom
      await jobRepository.update(
        { id: jobId },
        { deletedAt: new Date(), deletedBy: user.id, updatedBy: user.id },
      );
    });

    this.logger.log(`Job ${jobId} soft-deleted by user ${user.id}`);
    return buildResponse(Modules.Job, jobId, ActionType.Deleted);
  }
}
