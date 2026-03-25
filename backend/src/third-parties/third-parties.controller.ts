import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('third-parties')
export class ThirdPartiesController {
  constructor(private readonly service: ThirdPartiesService) {}

  @Post()
  create(@Body() dto: CreateThirdPartyDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateThirdPartyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
