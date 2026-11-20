import { UserResponse } from '../../../core/interfaces/user.interface';
import { JobIdRequestDto } from '../../dto/request/job-id-request.dto';

export class DeleteJobCommand {
  constructor(
    public readonly body: JobIdRequestDto,
    public readonly user: UserResponse,
  ) {}
}
