// Must match "package job;" in protos/job.proto
export const GRPC_PACKAGES = ['job'];

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  INTERNSHIP = 'INTERNSHIP',
}
