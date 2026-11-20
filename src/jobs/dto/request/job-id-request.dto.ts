import { Type } from 'class-transformer';
import { IsInt, Min, ValidateNested } from 'class-validator';
import { UserRequestDto } from '../../../core/dto/user-request.dto';

export class JobIdRequestDto {
  @IsInt() @Min(1)
  jobId: number;
}

// Used by FetchJob and DeleteJob
export class JobIdRequestWrapperDto {
  @ValidateNested() @Type(() => JobIdRequestDto)
  body: JobIdRequestDto;

  @ValidateNested() @Type(() => UserRequestDto)
  user: UserRequestDto;
}
