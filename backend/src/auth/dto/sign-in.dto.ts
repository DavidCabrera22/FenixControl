import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'admin@fenix.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
