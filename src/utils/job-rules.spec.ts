import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import {
  assertSalaryRange,
  duplicateJobError,
  escapeLike,
  isDuplicateEntry,
  jobNotFoundError,
} from './job-rules';

describe('assertSalaryRange', () => {
  it.each([
    [400000, 700000],
    [500000, 500000],
    [0, 0],
    [undefined, 700000],
    [400000, null],
    [null, null],
  ])('allows min %s with max %s', (min, max) => {
    expect(() => assertSalaryRange(min, max)).not.toThrow();
  });

  it('throws INVALID_ARGUMENT when min is greater than max', () => {
    try {
      assertSalaryRange(700000, 400000);
      throw new Error('expected assertSalaryRange to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(RpcException);
      expect((e as RpcException).getError()).toEqual({
        code: status.INVALID_ARGUMENT,
        message: 'Max salary must be greater than or equal to min salary',
      });
    }
  });
});

describe('isDuplicateEntry', () => {
  it.each([{ code: 'ER_DUP_ENTRY' }, { driverError: { code: 'ER_DUP_ENTRY' } }])(
    'recognises a duplicate-key error shaped like %j',
    (err) => {
      expect(isDuplicateEntry(err)).toBe(true);
    },
  );

  it.each([null, undefined, new Error('boom'), { code: 'ER_NO_SUCH_TABLE' }])(
    'returns false for %p',
    (err) => {
      expect(isDuplicateEntry(err)).toBe(false);
    },
  );
});

describe('duplicateJobError', () => {
  it('builds an ALREADY_EXISTS error', () => {
    expect(duplicateJobError().getError()).toEqual({
      code: status.ALREADY_EXISTS,
      message: 'This job is already posted',
    });
  });
});

describe('jobNotFoundError', () => {
  it('builds a NOT_FOUND error naming the job id', () => {
    expect(jobNotFoundError(12).getError()).toEqual({
      code: status.NOT_FOUND,
      message: 'Job 12 not found',
    });
  });
});

describe('escapeLike', () => {
  it.each([
    ['50%', '50\\%'],
    ['dev_ops', 'dev\\_ops'],
    ['a\\b', 'a\\\\b'],
    ['plain text', 'plain text'],
  ])('escapes %s as %s', (input, expected) => {
    expect(escapeLike(input)).toBe(expected);
  });
});
