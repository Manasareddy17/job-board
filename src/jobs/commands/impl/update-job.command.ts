import { UserResponse } from '../../../core/interfaces/user.interface';
import { UpdateJobRequestDto } from '../../dto/request/update-job-request.dto';

export class UpdateJobCommand {
  constructor(
    public readonly body: UpdateJobRequestDto,
    public readonly user: UserResponse,
  ) {}
}
