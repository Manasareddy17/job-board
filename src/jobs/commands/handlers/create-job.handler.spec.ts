import { status } from '@grpc/grpc-js';
import { JobType } from '../../../core/enums/global.enum';
import { Job } from '../../../entities/job.entity';
import { fakeDataSource, rpcErrorOf, testUser } from '../../test-utils';
import { CreateJobCommand } from '../impl/create-job.command';
import { CreateJobHandler } from './create-job.handler';

describe('CreateJobHandler', () => {
  const body = {
    title: 'Backend Developer',
    company: 'Acme',
    location: 'Hyderabad',
    type: JobType.FULL_TIME,
  };
  let repo: { create: jest.Mock; save: jest.Mock };
  let fake: ReturnType<typeof fakeDataSource>;
  let handler: CreateJobHandler;

  beforeEach(() => {
    repo = {
      create: jest.fn((d) => ({ ...d })),
      save: jest.fn(async (j) => ({ id: 5, ...j })),
    };
    fake = fakeDataSource(repo);
    handler = new CreateJobHandler(fake.dataSource);
  });

  describe('execute', () => {
    it('saves the job inside a transaction and returns the standard created message', async () => {
      await expect(handler.execute(new CreateJobCommand(body, testUser))).resolves.toEqual({
        id: '5',
        message: 'Successfully Created Job - 5',
      });
      expect(fake.transaction).toHaveBeenCalledTimes(1);
      expect(fake.manager.getRepository).toHaveBeenCalledWith(Job);
    });

    it('records the user as both creator and last updater', async () => {
      await handler.execute(new CreateJobCommand(body, testUser));

      expect(repo.save).toHaveBeenCalledWith({ ...body, createdBy: 7, updatedBy: 7 });
    });

    it.each([
      [400000, 700000],
      [500000, 500000],
      [undefined, 700000],
      [400000, undefined],
    ])('accepts salaryMin %s with salaryMax %s', async (salaryMin, salaryMax) => {
      await expect(
        handler.execute(new CreateJobCommand({ ...body, salaryMin, salaryMax }, testUser)),
      ).resolves.toBeDefined();
    });

    it('rejects a max salary below the min salary before opening a transaction', async () => {
      const error = await rpcErrorOf(
        handler.execute(
          new CreateJobCommand({ ...body, salaryMin: 700000, salaryMax: 400000 }, testUser),
        ),
      );

      expect(error).toEqual({
        code: status.INVALID_ARGUMENT,
        message: 'Max salary must be greater than or equal to min salary',
      });
      expect(fake.transaction).not.toHaveBeenCalled();
    });

    // Throwing inside the transaction callback is what makes TypeORM roll back
    it('throws ALREADY_EXISTS from inside the transaction when the job is already posted', async () => {
      repo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      expect(await rpcErrorOf(handler.execute(new CreateJobCommand(body, testUser)))).toEqual({
        code: status.ALREADY_EXISTS,
        message: 'This job is already posted',
      });
      expect(fake.transaction).toHaveBeenCalledTimes(1);
    });

    it('rethrows any other database error unchanged', async () => {
      const dbDown = new Error('connect ECONNREFUSED');
      repo.save.mockRejectedValue(dbDown);

      await expect(handler.execute(new CreateJobCommand(body, testUser))).rejects.toBe(dbDown);
    });
  });
});
