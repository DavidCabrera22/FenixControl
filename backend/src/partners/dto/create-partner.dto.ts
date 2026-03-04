import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the partner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '123456789',
    description: 'The unique identification document of the partner',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  document: string;
}
