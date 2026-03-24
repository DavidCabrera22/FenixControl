import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@fenix.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
