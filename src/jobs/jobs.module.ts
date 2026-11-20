import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';
import { CreateJobHandler } from './commands/handlers/create-job.handler';
import { DeleteJobHandler } from './commands/handlers/delete-job.handler';
import { UpdateJobHandler } from './commands/handlers/update-job.handler';
import { JobsController } from './controllers/jobs.controller';
import { FetchJobHandler } from './queries/handlers/fetch-job.handler';
import { FetchJobsHandler } from './queries/handlers/fetch-jobs.handler';

const CommandHandlers = [CreateJobHandler, UpdateJobHandler, DeleteJobHandler];
const QueryHandlers = [FetchJobHandler, FetchJobsHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Job])],
  controllers: [JobsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class JobsModule {}
