import { status } from '@grpc/grpc-js';
import { ArgumentMetadata } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateJobRequestWrapperDto } from '../../jobs/dto/request/create-job-request.dto';
import { flattenValidationErrors, grpcValidationPipe } from './grpc-validation.pipe';

const validRequest = {
  body: { title: 'Backend Developer', company: 'Acme', location: 'Hyderabad', type: 'FULL_TIME' },
  user: { id: 7, firstName: 'Test', lastName: 'User', email: 'test.user@example.com' },
};
const meta: ArgumentMetadata = { type: 'body', metatype: CreateJobRequestWrapperDto };

describe('flattenValidationErrors', () => {
  it('returns top-level messages unchanged', () => {
    expect(
      flattenValidationErrors([{ property: 'id', constraints: { min: 'id must not be less than 1' } }]),
    ).toEqual(['id must not be less than 1']);
  });

  // Requests are { body, user }, so the real messages sit in children
  it('prefixes nested messages with their path', () => {
    expect(
      flattenValidationErrors([
        {
          property: 'body',
          children: [{ property: 'title', constraints: { isLength: 'title is too short' } }],
        },
      ]),
    ).toEqual(['body.title is too short']);
  });

  it('returns nothing when there are no errors', () => {
    expect(flattenValidationErrors([])).toEqual([]);
  });
});

describe('grpcValidationPipe', () => {
  it('passes a valid request through, trimmed and with unknown fields removed', async () => {
    const result = await grpcValidationPipe.transform(
      { ...validRequest, body: { ...validRequest.body, title: '  Backend Developer  ', hacker: 'x' } },
      meta,
    );

    expect(result.body.title).toBe('Backend Developer');
    expect(result.body).not.toHaveProperty('hacker');
  });

  it('throws INVALID_ARGUMENT naming every bad nested field', async () => {
    const err = await grpcValidationPipe
      .transform(
        { body: { ...validRequest.body, title: 'ab' }, user: { ...validRequest.user, email: 'nope' } },
        meta,
      )
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(RpcException);
    const { code, message } = (err as RpcException).getError() as { code: number; message: string };
    expect(code).toBe(status.INVALID_ARGUMENT);
    expect(message).toContain('body.title must be longer than or equal to 3 characters');
    expect(message).toContain('user.email must be an email');
  });
});
