import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserRequestDto } from '../../../core/dto/user-request.dto';
import { JobType } from '../../../core/enums/global.enum';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class FetchJobsRequestDto {
  @IsOptional() @Transform(trim) @IsString()
  q?: string; // searches title or company

  @IsOptional() @IsEnum(JobType)
  type?: JobType;

  @IsOptional() @Transform(trim) @IsString()
  location?: string;

  @IsOptional() @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(50)
  pageSize: number = 10;
}

export class FetchJobsRequestWrapperDto {
  @ValidateNested() @Type(() => FetchJobsRequestDto)
  body: FetchJobsRequestDto;

  @ValidateNested() @Type(() => UserRequestDto)
  user: UserRequestDto;
}
