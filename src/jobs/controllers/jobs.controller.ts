import { Controller, Logger, UsePipes } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { Job } from '../../entities/job.entity';
import { grpcValidationPipe } from '../../grpc/pipes/grpc-validation.pipe';
import { CreateJobCommand } from '../commands/impl/create-job.command';
import { DeleteJobCommand } from '../commands/impl/delete-job.command';
import { UpdateJobCommand } from '../commands/impl/update-job.command';
import { CreateJobRequestWrapperDto } from '../dto/request/create-job-request.dto';
import { FetchJobsRequestWrapperDto } from '../dto/request/fetch-jobs-request.dto';
import { JobIdRequestWrapperDto } from '../dto/request/job-id-request.dto';
import { UpdateJobRequestWrapperDto } from '../dto/request/update-job-request.dto';
import { toJobProto } from '../mappers/job.mapper';
import { FetchJobsResult } from '../queries/handlers/fetch-jobs.handler';
import { FetchJobQuery } from '../queries/impl/fetch-job.query';
import { FetchJobsQuery } from '../queries/impl/fetch-jobs.query';

// Each @GrpcMethod matches an rpc in protos/job.proto (service JobService).
// Every request is { body, user }. Writes go to the CommandBus, reads to the QueryBus.
@Controller()
@UsePipes(grpcValidationPipe)
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod('JobService', 'CreateJob')
  async createJob(@Payload() data: CreateJobRequestWrapperDto) {
    const { body, user } = data;
    this.logger.debug(`create job - data:${JSON.stringify(body)}`);
    return this.commandBus.execute(new CreateJobCommand(body, user));
  }

  @GrpcMethod('JobService', 'FetchJob')
  async fetchJob(@Payload() data: JobIdRequestWrapperDto) {
    const { body, user } = data;
    const job: Job = await this.queryBus.execute(new FetchJobQuery(body, user));
    return { job: toJobProto(job) };
  }

  @GrpcMethod('JobService', 'FetchJobs')
  async fetchJobs(@Payload() data: FetchJobsRequestWrapperDto) {
    const { body, user } = data;
    const { items, total }: FetchJobsResult = await this.queryBus.execute(
      new FetchJobsQuery(body, user),
    );
    return {
      items: items.map(toJobProto),
      total,
      page: body.page,
      pageSize: body.pageSize,
    };
  }

  @GrpcMethod('JobService', 'UpdateJob')
  async updateJob(@Payload() data: UpdateJobRequestWrapperDto) {
    const { body, user } = data;
    this.logger.debug(`update job - data:${JSON.stringify(body)}`);
    return this.commandBus.execute(new UpdateJobCommand(body, user));
  }

  @GrpcMethod('JobService', 'DeleteJob')
  async deleteJob(@Payload() data: JobIdRequestWrapperDto) {
    const { body, user } = data;
    this.logger.debug(`delete job - data:${JSON.stringify(body)}`);
    return this.commandBus.execute(new DeleteJobCommand(body, user));
  }
}
