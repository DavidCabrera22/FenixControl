import { PartialType } from '@nestjs/swagger';
import { CreateThirdPartyDto } from './create-third-party.dto';

export class UpdateThirdPartyDto extends PartialType(CreateThirdPartyDto) {}
