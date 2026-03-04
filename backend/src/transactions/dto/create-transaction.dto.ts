import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionSourceItemDto {
  @ApiProperty({ example: 'uuid-of-source', description: 'Source UUID' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ example: 500000, description: 'Amount from this source' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;
}

export class CreateTransactionDto {
  @ApiProperty({
    example: '2026-03-03',
    description: 'Transaction date (ISO 8601)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'INCOME',
    description: 'Type: INCOME, EXPENSE, TRANSFER',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 1500000, description: 'Total transaction amount' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    example: 'uuid-of-account',
    description: 'Source account UUID (for EXPENSE or TRANSFER)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  accountFromId?: string;

  @ApiProperty({
    example: 'uuid-of-account',
    description: 'Destination account UUID (for INCOME or TRANSFER)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  accountToId?: string;

  @ApiProperty({
    example: 'uuid-of-category',
    description: 'Category UUID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    example: 'uuid-of-allocation',
    description: 'Allocation (Reparto) UUID if linked',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  allocationId?: string;

  @ApiProperty({ description: 'Notes or description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Third party name (cliente/proveedor)', required: false })
  @IsOptional()
  @IsString()
  thirdPartyName?: string;

  @ApiProperty({ description: 'URL or path to attached file', required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @ApiProperty({
    type: [TransactionSourceItemDto],
    description: 'Virtual sources that fund this transaction',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionSourceItemDto)
  sources?: TransactionSourceItemDto[];
}
