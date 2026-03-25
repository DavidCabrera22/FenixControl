import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  @Length(0, 20)
  document?: string;
}
