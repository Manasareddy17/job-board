import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

export function assertSalaryRange(
  min?: number | null,
  max?: number | null,
): void {
  if (min != null && max != null && min > max) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Max salary must be greater than or equal to min salary',
    });
  }
}

// MySQL throws ER_DUP_ENTRY when the same title + company + location already exists.
// TypeORM puts the code on the error itself or on driverError depending on version.
export function isDuplicateEntry(err: unknown): boolean {
  const e = err as { code?: string; driverError?: { code?: string } } | null;
  return e?.code === 'ER_DUP_ENTRY' || e?.driverError?.code === 'ER_DUP_ENTRY';
}

export const duplicateJobError = () =>
  new RpcException({
    code: status.ALREADY_EXISTS,
    message: 'This job is already posted',
  });

export const jobNotFoundError = (id: number) =>
  new RpcException({ code: status.NOT_FOUND, message: `Job ${id} not found` });

// % and _ are LIKE wildcards; escape them so "50%" searches for the text "50%".
export const escapeLike = (text: string) =>
  text.replace(/[\\%_]/g, (c) => `\\${c}`);
