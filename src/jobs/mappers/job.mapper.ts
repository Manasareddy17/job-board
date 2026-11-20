import { Job } from '../../entities/job.entity';

// gRPC can't send Date or null: dates become ISO strings, nulls become undefined.
export function toJobProto(job: Job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    description: job.description ?? undefined,
    notifiedAt: job.notifiedAt?.toISOString(),
    createdAt: job.createdAt.toISOString(),
  };
}
