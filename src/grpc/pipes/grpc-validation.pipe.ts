import { ValidationError, ValidationPipe } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

// Requests are { body, user }, so errors for body.title live in error.children.
// Walk the whole tree and prefix each message with its path, e.g. "body.title must be ...".
export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): string[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) =>
      parentPath ? `${parentPath}.${message}` : message,
    );
    return [...own, ...flattenValidationErrors(error.children ?? [], path)];
  });
}

// The normal ValidationPipe throws HTTP 400; gRPC needs INVALID_ARGUMENT instead.
export const grpcValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (errors) =>
    new RpcException({
      code: status.INVALID_ARGUMENT,
      message: flattenValidationErrors(errors).join(', '),
    }),
});
