import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsInt, Min, ValidateNested } from 'class-validator';
import { UserRequestDto } from '../../../core/dto/user-request.dto';
import { CreateJobRequestDto } from './create-job-request.dto';

// Same rules as create, every field optional, plus the id of the job to change
export class UpdateJobRequestDto extends PartialType(CreateJobRequestDto) {
  @IsInt() @Min(1)
  jobId: number;
}

export class UpdateJobRequestWrapperDto {
  @ValidateNested() @Type(() => UpdateJobRequestDto)
  body: UpdateJobRequestDto;

  @ValidateNested() @Type(() => UserRequestDto)
  user: UserRequestDto;
}
