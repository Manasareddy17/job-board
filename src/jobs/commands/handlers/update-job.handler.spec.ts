import { status } from '@grpc/grpc-js';
import { fakeDataSource, makeJob, rpcErrorOf, testUser } from '../../test-utils';
import { UpdateJobCommand } from '../impl/update-job.command';
import { UpdateJobHandler } from './update-job.handler';

describe('UpdateJobHandler', () => {
  const editor = { ...testUser, id: 9 };
  let repo: { findOne: jest.Mock; save: jest.Mock };
  let fake: ReturnType<typeof fakeDataSource>;
  let handler: UpdateJobHandler;

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue(makeJob()),
      save: jest.fn(async (job) => job),
    };
    fake = fakeDataSource(repo);
    handler = new UpdateJobHandler(fake.dataSource);
  });

  describe('execute', () => {
    it('changes only the sent fields, records the editor and returns the updated message', async () => {
      await expect(
        handler.execute(new UpdateJobCommand({ jobId: 1, location: 'Bangalore' }, editor)),
      ).resolves.toEqual({ id: '1', message: 'Successfully Updated Job - 1' });

      expect(repo.save).toHaveBeenCalledWith(
        makeJob({ location: 'Bangalore', updatedBy: 9 }),
      );
    });

    // The lock stops two updates to the same job from overwriting each other
    it('reads the job with a row lock inside the transaction', async () => {
      await handler.execute(new UpdateJobCommand({ jobId: 1, title: 'New title' }, editor));

      expect(fake.transaction).toHaveBeenCalledTimes(1);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('returns NOT_FOUND without saving when the job is missing', async () => {
      repo.findOne.mockResolvedValue(null);

      expect(
        await rpcErrorOf(handler.execute(new UpdateJobCommand({ jobId: 9, title: 'New' }, editor))),
      ).toEqual({ code: status.NOT_FOUND, message: 'Job 9 not found' });
      expect(repo.save).not.toHaveBeenCalled();
    });

    // Sending only one salary must still be checked against the saved other one
    it.each([{ salaryMin: 900000 }, { salaryMax: 100000 }])(
      'rejects %j because it conflicts with the saved salary',
      async (change) => {
        const error = await rpcErrorOf(
          handler.execute(new UpdateJobCommand({ jobId: 1, ...change }, editor)),
        );

        expect(error).toMatchObject({ code: status.INVALID_ARGUMENT });
        expect(repo.save).not.toHaveBeenCalled();
      },
    );

    it('allows a new salary range that is valid on its own', async () => {
      await handler.execute(
        new UpdateJobCommand({ jobId: 1, salaryMin: 900000, salaryMax: 1200000 }, editor),
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ salaryMin: 900000, salaryMax: 1200000 }),
      );
    });

    it('does not copy jobId onto the saved entity', async () => {
      await handler.execute(new UpdateJobCommand({ jobId: 1, title: 'New title' }, editor));

      expect(repo.save.mock.calls[0][0]).not.toHaveProperty('jobId');
    });

    it('returns ALREADY_EXISTS when the change duplicates another job', async () => {
      repo.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } });

      expect(
        await rpcErrorOf(
          handler.execute(new UpdateJobCommand({ jobId: 1, company: 'Globex' }, editor)),
        ),
      ).toEqual({ code: status.ALREADY_EXISTS, message: 'This job is already posted' });
    });

    it('rethrows any other database error unchanged', async () => {
      const dbDown = new Error('connect ECONNREFUSED');
      repo.save.mockRejectedValue(dbDown);

      await expect(
        handler.execute(new UpdateJobCommand({ jobId: 1, title: 'New title' }, editor)),
      ).rejects.toBe(dbDown);
    });
  });
});
