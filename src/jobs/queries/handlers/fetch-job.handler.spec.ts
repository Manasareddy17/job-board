import { status } from '@grpc/grpc-js';
import { Repository } from 'typeorm';
import { Job } from '../../../entities/job.entity';
import { makeJob, rpcErrorOf, testUser } from '../../test-utils';
import { FetchJobQuery } from '../impl/fetch-job.query';
import { FetchJobHandler } from './fetch-job.handler';

// @nestjs/typeorm@12 is ES-module-only, which Jest can't load; the handler is built by hand.
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => undefined }));

describe('FetchJobHandler', () => {
  let repo: { findOneBy: jest.Mock };
  let handler: FetchJobHandler;

  beforeEach(() => {
    repo = { findOneBy: jest.fn() };
    handler = new FetchJobHandler(repo as unknown as Repository<Job>);
  });

  describe('execute', () => {
    it('returns the job for the jobId in the body', async () => {
      repo.findOneBy.mockResolvedValue(makeJob());

      await expect(
        handler.execute(new FetchJobQuery({ jobId: 1 }, testUser)),
      ).resolves.toEqual(makeJob());
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns NOT_FOUND with the id in the message when the job is missing', async () => {
      repo.findOneBy.mockResolvedValue(null);

      expect(
        await rpcErrorOf(handler.execute(new FetchJobQuery({ jobId: 42 }, testUser))),
      ).toEqual({ code: status.NOT_FOUND, message: 'Job 42 not found' });
    });
  });
});
