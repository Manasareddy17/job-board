import { UserResponse } from '../../../core/interfaces/user.interface';
import { FetchJobsRequestDto } from '../../dto/request/fetch-jobs-request.dto';

export class FetchJobsQuery {
  constructor(
    public readonly body: FetchJobsRequestDto,
    public readonly user: UserResponse,
  ) {}
}
