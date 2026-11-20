import { status } from '@grpc/grpc-js';
import { fakeDataSource, makeJob, rpcErrorOf, testUser } from '../../test-utils';
import { DeleteJobCommand } from '../impl/delete-job.command';
import { DeleteJobHandler } from './delete-job.handler';

describe('DeleteJobHandler', () => {
  const deleter = { ...testUser, id: 9 };
  let repo: { findOne: jest.Mock; update: jest.Mock; delete: jest.Mock };
  let fake: ReturnType<typeof fakeDataSource>;
  let handler: DeleteJobHandler;

  beforeEach(() => {
    repo = {
      findOne: jest.fn().mockResolvedValue(makeJob({ id: 5 })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn(),
    };
    fake = fakeDataSource(repo);
    handler = new DeleteJobHandler(fake.dataSource);
  });

  describe('execute', () => {
    it('returns the standard deleted message', async () => {
      await expect(
        handler.execute(new DeleteJobCommand({ jobId: 5 }, deleter)),
      ).resolves.toEqual({ id: '5', message: 'Successfully Deleted Job - 5' });
    });

    it('marks the row as deleted with the time and user instead of removing it', async () => {
      await handler.execute(new DeleteJobCommand({ jobId: 5 }, deleter));

      expect(repo.update).toHaveBeenCalledWith(
        { id: 5 },
        { deletedAt: expect.any(Date), deletedBy: 9, updatedBy: 9 },
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('locks the row inside the transaction before marking it', async () => {
      await handler.execute(new DeleteJobCommand({ jobId: 5 }, deleter));

      expect(fake.transaction).toHaveBeenCalledTimes(1);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        lock: { mode: 'pessimistic_write' },
      });
    });

    // findOne skips soft-deleted rows, so a second delete lands here too
    it('returns NOT_FOUND without updating when the job is missing or already deleted', async () => {
      repo.findOne.mockResolvedValue(null);

      expect(
        await rpcErrorOf(handler.execute(new DeleteJobCommand({ jobId: 7 }, deleter))),
      ).toEqual({ code: status.NOT_FOUND, message: 'Job 7 not found' });
      expect(repo.update).not.toHaveBeenCalled();
    });

    // Reproduces the earlier bug where the whole command object was used as the id
    it('looks the job up by the jobId number, not the command object', async () => {
      await handler.execute(new DeleteJobCommand({ jobId: 5 }, deleter));

      expect(repo.findOne.mock.calls[0][0].where).toEqual({ id: 5 });
    });

    it('rethrows a database error from the update so the transaction rolls back', async () => {
      const dbDown = new Error('connect ECONNREFUSED');
      repo.update.mockRejectedValue(dbDown);

      await expect(
        handler.execute(new DeleteJobCommand({ jobId: 5 }, deleter)),
      ).rejects.toBe(dbDown);
    });
  });
});
