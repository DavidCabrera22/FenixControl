import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllocationDto {
  @ApiProperty({
    example: '2026-03-01',
    description: 'Allocation date (ISO 8601)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'uuid-of-account',
    description: 'Account where the allocation is drawn from',
  })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 5000000, description: 'Total amount to distribute' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalAmount: number;

  @ApiProperty({
    example: 'OPEN',
    description: 'Status: OPEN, CLOSED, CANCELLED',
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: 'Reparto mensual de software',
    description: 'Optional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
