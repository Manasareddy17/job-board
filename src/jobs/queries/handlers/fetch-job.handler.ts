import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../../entities/job.entity';
import { jobNotFoundError } from '../../../utils/job-rules';
import { FetchJobQuery } from '../impl/fetch-job.query';

@QueryHandler(FetchJobQuery)
export class FetchJobHandler implements IQueryHandler<FetchJobQuery, Job> {
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
  ) {}

  async execute(query: FetchJobQuery): Promise<Job> {
    const { body } = query;
    const { jobId } = body;

    const job = await this.jobRepository.findOneBy({ id: jobId });
    if (!job) throw jobNotFoundError(jobId);
    return job;
  }
}
