import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Food', description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'EXPENSE', enum: CategoryType })
  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType;
}
