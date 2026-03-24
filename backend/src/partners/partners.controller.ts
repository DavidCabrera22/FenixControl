import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Partners')
@UseGuards(JwtAuthGuard)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo socio' })
  @ApiResponse({
    status: 201,
    description: 'El socio ha sido creado exitosamente.',
  })
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los socios' })
  @ApiResponse({ status: 200, description: 'Retornar todos los socios.' })
  findAll() {
    return this.partnersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un socio por ID' })
  @ApiResponse({ status: 200, description: 'Retornar el socio.' })
  @ApiResponse({ status: 404, description: 'Socio no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.partnersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un socio' })
  @ApiResponse({
    status: 200,
    description: 'El socio ha sido actualizado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado.' })
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un socio' })
  @ApiResponse({
    status: 200,
    description: 'El socio ha sido eliminado exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Socio no encontrado.' })
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
