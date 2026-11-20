import { RpcException } from '@nestjs/microservices';
import { DataSource } from 'typeorm';
import { JobType } from '../core/enums/global.enum';
import { UserResponse } from '../core/interfaces/user.interface';
import { Job } from '../entities/job.entity';

export const testUser: UserResponse = {
  id: 7,
  firstName: 'Test',
  lastName: 'User',
  email: 'test.user@example.com',
};

export const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  title: 'Backend Developer',
  company: 'Acme',
  location: 'Hyderabad',
  type: JobType.FULL_TIME,
  salaryMin: 400000,
  salaryMax: 700000,
  description: null,
  createdBy: 7,
  updatedBy: 7,
  notifiedAt: null,
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
  updatedAt: new Date('2026-11-20T10:00:00.000Z'),
  deletedAt: null,
  deletedBy: null,
  ...overrides,
});

// A DataSource whose transaction() just runs the callback with a manager
// that hands back the given fake repository.
export function fakeDataSource(repo: object) {
  const manager = { getRepository: jest.fn().mockReturnValue(repo) };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) => work(manager)),
  };
  return { dataSource: dataSource as unknown as DataSource, transaction: dataSource.transaction, manager };
}

// Awaits a promise that should reject with an RpcException and returns its { code, message }
export async function rpcErrorOf(promise: Promise<unknown>) {
  const err = await promise.then(
    () => {
      throw new Error('expected an RpcException but the call succeeded');
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(RpcException);
  return (err as RpcException).getError();
}
