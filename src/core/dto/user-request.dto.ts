import { IsEmail, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { UserResponse } from '../interfaces/user.interface';

export class UserRequestDto implements UserResponse {
  @IsInt() @Min(1)
  id: number;

  @IsString() @IsNotEmpty()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;
}
