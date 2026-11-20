// DTOs use class-transformer's @Type(), which needs reflect-metadata (Nest loads it at runtime)
import 'reflect-metadata';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JobType } from '../../core/enums/global.enum';
import { CreateJobCommand } from '../commands/impl/create-job.command';
import { DeleteJobCommand } from '../commands/impl/delete-job.command';
import { UpdateJobCommand } from '../commands/impl/update-job.command';
import { FetchJobsRequestDto } from '../dto/request/fetch-jobs-request.dto';
import { toJobProto } from '../mappers/job.mapper';
import { FetchJobQuery } from '../queries/impl/fetch-job.query';
import { FetchJobsQuery } from '../queries/impl/fetch-jobs.query';
import { makeJob, testUser as user } from '../test-utils';
import { JobsController } from './jobs.controller';

describe('JobsController', () => {
  const job = makeJob();
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let controller: JobsController;

  beforeEach(() => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    controller = new JobsController(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  describe('createJob', () => {
    it('sends a CreateJobCommand with body and user and returns its reply', async () => {
      const body = { title: 'Backend Developer', company: 'Acme', location: 'Hyderabad', type: JobType.FULL_TIME };
      const reply = { id: '1', message: 'Successfully Created Job - 1' };
      commandBus.execute.mockResolvedValue(reply);

      await expect(controller.createJob({ body, user })).resolves.toBe(reply);
      expect(commandBus.execute).toHaveBeenCalledWith(new CreateJobCommand(body, user));
    });
  });

  describe('fetchJob', () => {
    it('sends a FetchJobQuery and returns the job in proto shape', async () => {
      queryBus.execute.mockResolvedValue(job);

      await expect(controller.fetchJob({ body: { jobId: 1 }, user })).resolves.toEqual({
        job: toJobProto(job),
      });
      expect(queryBus.execute).toHaveBeenCalledWith(new FetchJobQuery({ jobId: 1 }, user));
    });
  });

  describe('fetchJobs', () => {
    // The gateway shows page numbers, so the reply must echo the page that was used
    it('sends a FetchJobsQuery and returns the page with its paging info', async () => {
      const body = Object.assign(new FetchJobsRequestDto(), { q: 'dev', page: 2, pageSize: 5 });
      queryBus.execute.mockResolvedValue({ items: [job], total: 6 });

      await expect(controller.fetchJobs({ body, user })).resolves.toEqual({
        items: [toJobProto(job)],
        total: 6,
        page: 2,
        pageSize: 5,
      });
      expect(queryBus.execute).toHaveBeenCalledWith(new FetchJobsQuery(body, user));
    });
  });

  describe('updateJob', () => {
    it('sends an UpdateJobCommand with body and user and returns its reply', async () => {
      const body = { jobId: 1, location: 'Bangalore' };
      const reply = { id: '1', message: 'Successfully Updated Job - 1' };
      commandBus.execute.mockResolvedValue(reply);

      await expect(controller.updateJob({ body, user })).resolves.toBe(reply);
      expect(commandBus.execute).toHaveBeenCalledWith(new UpdateJobCommand(body, user));
    });
  });

  describe('deleteJob', () => {
    it('sends a DeleteJobCommand with body and user and returns its reply', async () => {
      const reply = { id: '3', message: 'Successfully Deleted Job - 3' };
      commandBus.execute.mockResolvedValue(reply);

      await expect(controller.deleteJob({ body: { jobId: 3 }, user })).resolves.toBe(reply);
      expect(commandBus.execute).toHaveBeenCalledWith(new DeleteJobCommand({ jobId: 3 }, user));
    });
  });
});
