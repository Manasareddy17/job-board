import { UserResponse } from '../../../core/interfaces/user.interface';
import { CreateJobRequestDto } from '../../dto/request/create-job-request.dto';

export class CreateJobCommand {
  constructor(
    public readonly body: CreateJobRequestDto,
    public readonly user: UserResponse,
  ) {}
}
