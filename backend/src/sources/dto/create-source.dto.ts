import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSourceDto {
  @ApiProperty({ example: 'Software', description: 'Virtual source name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'SOFTWARE',
    description: 'Source type (e.g., SOFTWARE, RENT, LOAN)',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 5000000, description: 'Initial virtual balance' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialBalance: number;

  @ApiProperty({ example: 5000000, description: 'Current virtual balance' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentBalance: number;

  @ApiProperty({
    example: 'uuid-of-partner',
    description: 'Owner Partner ID (UUID)',
  })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;
}
