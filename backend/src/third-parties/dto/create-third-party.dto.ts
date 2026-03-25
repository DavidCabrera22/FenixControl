import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateThirdPartyDto {
  @ApiProperty({ example: 'Cliente ABC' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '900123456-1' })
  @IsString()
  @IsOptional()
  document?: string;
}
