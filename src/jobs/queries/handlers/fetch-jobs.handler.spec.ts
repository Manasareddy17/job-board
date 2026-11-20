// DTOs use class-transformer's @Type(), which needs reflect-metadata (Nest loads it at runtime)
import 'reflect-metadata';
import { Repository } from 'typeorm';
import { JobType } from '../../../core/enums/global.enum';
import { Job } from '../../../entities/job.entity';
import { FetchJobsRequestDto } from '../../dto/request/fetch-jobs-request.dto';
import { makeJob, testUser } from '../../test-utils';
import { FetchJobsQuery } from '../impl/fetch-jobs.query';
import { FetchJobsHandler } from './fetch-jobs.handler';

// @nestjs/typeorm@12 is ES-module-only, which Jest can't load; the handler is built by hand.
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));

const query = (overrides: Partial<FetchJobsRequestDto> = {}) =>
  new FetchJobsQuery(Object.assign(new FetchJobsRequestDto(), overrides), testUser);

describe('FetchJobsHandler', () => {
  let qb: Record<string, jest.Mock>;
  let handler: FetchJobsHandler;

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[makeJob()], 1]),
    };
    const repo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
    handler = new FetchJobsHandler(repo as unknown as Repository<Job>);
  });

  describe('execute', () => {
    it('returns items and total, newest first, when there are no filters', async () => {
      await expect(handler.execute(query())).resolves.toEqual({
        items: [makeJob()],
        total: 1,
      });
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.orderBy).toHaveBeenCalledWith('job.createdAt', 'DESC');
    });

    it.each([
      [1, 10, 0],
      [3, 10, 20],
      [2, 50, 50],
    ])('skips the right rows for page %i with pageSize %i', async (page, pageSize, skip) => {
      await handler.execute(query({ page, pageSize }));

      expect(qb.skip).toHaveBeenCalledWith(skip);
      expect(qb.take).toHaveBeenCalledWith(pageSize);
    });

    it.each([
      [{ type: JobType.INTERNSHIP }, 'job.type = :type', { type: 'INTERNSHIP' }],
      [{ location: 'Hyd' }, 'job.location LIKE :location', { location: '%Hyd%' }],
      [{ q: 'dev' }, '(job.title LIKE :q OR job.company LIKE :q)', { q: '%dev%' }],
    ])('filters by %j', async (filter, sql, params) => {
      await handler.execute(query(filter));

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith(sql, params);
    });

    it('combines all filters together', async () => {
      await handler.execute(query({ type: JobType.PART_TIME, location: 'Hyd', q: 'dev' }));

      expect(qb.andWhere).toHaveBeenCalledTimes(3);
    });

    // Without escaping, a search for "50%" would match every title containing "50"
    it('escapes LIKE wildcards in the search text', async () => {
      await handler.execute(query({ q: '50%_off' }));

      expect(qb.andWhere).toHaveBeenCalledWith(expect.any(String), { q: '%50\\%\\_off%' });
    });

    // An empty search box sends q="" and must not filter out every job
    it.each(['q', 'location'] as const)('ignores an empty %s', async (key) => {
      await handler.execute(query({ [key]: '' }));

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });
});
