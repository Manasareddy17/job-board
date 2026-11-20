import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserRequestDto } from '../../../core/dto/user-request.dto';
import { JobType } from '../../../core/enums/global.enum';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateJobRequestDto {
  @Transform(trim) @IsString() @Length(3, 120)
  title: string;

  @Transform(trim) @IsString() @Length(2, 120)
  company: string;

  @Transform(trim) @IsString() @Length(2, 80)
  location: string;

  @IsEnum(JobType)
  type: JobType;

  @IsOptional() @IsInt() @Min(0)
  salaryMin?: number;

  @IsOptional() @IsInt() @Min(0)
  salaryMax?: number;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000)
  description?: string;
}

// gRPC request = { body, user }
export class CreateJobRequestWrapperDto {
  @ValidateNested() @Type(() => CreateJobRequestDto)
  body: CreateJobRequestDto;

  @ValidateNested() @Type(() => UserRequestDto)
  user: UserRequestDto;
}
