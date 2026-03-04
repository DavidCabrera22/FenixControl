import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateObligationDto {
  @ApiProperty({ example: 'Hipoteca local', description: 'Obligation name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'DEBT',
    description: 'Obligation type (e.g., DEBT, LOAN, LEASE)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'uuid-of-partner', description: 'Linked partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ example: 50000000, description: 'Original obligation amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialAmount: number;

  @ApiProperty({ example: 48000000, description: 'Remaining amount to pay' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  remainingAmount: number;

  @ApiProperty({ example: 1.5, description: 'Monthly interest rate (%)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interestRate: number;

  @ApiProperty({
    example: '2027-12-31',
    description: 'Due date (ISO 8601 format)',
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status: ACTIVE, PAID, OVERDUE',
  })
  @IsString()
  @IsNotEmpty()
  status: string;
}
