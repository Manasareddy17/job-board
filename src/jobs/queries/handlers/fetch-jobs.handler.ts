import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../../entities/job.entity';
import { escapeLike } from '../../../utils/job-rules';
import { FetchJobsQuery } from '../impl/fetch-jobs.query';

export interface FetchJobsResult {
  items: Job[];
  total: number;
}

@QueryHandler(FetchJobsQuery)
export class FetchJobsHandler
  implements IQueryHandler<FetchJobsQuery, FetchJobsResult>
{
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
  ) {}

  async execute(query: FetchJobsQuery): Promise<FetchJobsResult> {
    const { body } = query;
    const qb = this.jobRepository.createQueryBuilder('job');

    if (body.type) {
      qb.andWhere('job.type = :type', { type: body.type });
    }
    if (body.location) {
      qb.andWhere('job.location LIKE :location', {
        location: `%${escapeLike(body.location)}%`,
      });
    }
    if (body.q) {
      qb.andWhere('(job.title LIKE :q OR job.company LIKE :q)', {
        q: `%${escapeLike(body.q)}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('job.createdAt', 'DESC')
      .skip((body.page - 1) * body.pageSize)
      .take(body.pageSize)
      .getManyAndCount();

    return { items, total };
  }
}
