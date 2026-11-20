import { makeJob } from '../test-utils';
import { toJobProto } from './job.mapper';

describe('toJobProto', () => {
  it('turns dates into ISO strings', () => {
    const proto = toJobProto(makeJob({ notifiedAt: new Date('2026-11-20T10:00:02.000Z') }));

    expect(proto).toMatchObject({
      createdAt: '2026-11-20T10:00:00.000Z',
      notifiedAt: '2026-11-20T10:00:02.000Z',
    });
  });

  // gRPC rejects null for scalar fields, so empty values must be undefined
  it.each(['salaryMin', 'salaryMax', 'description', 'notifiedAt'] as const)(
    'sends a null %s as undefined',
    (field) => {
      expect(toJobProto(makeJob({ [field]: null }))[field]).toBeUndefined();
    },
  );

  it('keeps a salary of 0', () => {
    expect(toJobProto(makeJob({ salaryMin: 0 })).salaryMin).toBe(0);
  });

  it('leaves out updatedAt, which the proto does not have', () => {
    expect(toJobProto(makeJob())).not.toHaveProperty('updatedAt');
  });
});
