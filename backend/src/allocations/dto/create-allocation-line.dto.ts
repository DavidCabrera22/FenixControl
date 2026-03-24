import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllocationLineDto {
  @ApiProperty({
    example: 'EXPENSE',
    description: 'Line type: EXPENSE, PARTNER_PAYMENT, OBLIGATION_PAYMENT, ACCOUNT_TRANSFER',
  })
  @IsString()
  lineType: string;

  @ApiProperty({ example: 1500000, description: 'Amount for this line' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'uuid-of-account', required: false })
  @IsOptional()
  @IsUUID()
  targetAccountId?: string;

  @ApiProperty({ example: 'uuid-of-partner', required: false })
  @IsOptional()
  @IsUUID()
  targetPartnerId?: string;

  @ApiProperty({ example: 'uuid-of-obligation', required: false })
  @IsOptional()
  @IsUUID()
  targetObligationId?: string;

  @ApiProperty({ example: 'uuid-of-category', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'Pago cuota enero', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
