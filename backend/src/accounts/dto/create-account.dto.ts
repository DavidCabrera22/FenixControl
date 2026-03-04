import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  SAVINGS = 'SAVINGS',
}

export class CreateAccountDto {
  @ApiProperty({ example: 'Bancolombia Ahorros', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'BANK',
    enum: AccountType,
    description: 'Account type: BANK, CASH, or SAVINGS',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 1000000,
    description: 'Initial balance of this account',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialBalance: number;

  @ApiProperty({
    example: 1000000,
    description: 'Current balance of this account',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentBalance: number;
}
