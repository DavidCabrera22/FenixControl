import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Food', description: 'The name of the category' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'EXPENSE',
    enum: CategoryType,
    description: 'The type of the category (INCOME or EXPENSE)',
  })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;
}
