import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ObligationsService } from './obligations.service';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Obligations')
@UseGuards(JwtAuthGuard)
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva obligación (deuda)' })
  @ApiResponse({ status: 201, description: 'Obligación creada.' })
  create(@Body() createObligationDto: CreateObligationDto) {
    return this.obligationsService.create(createObligationDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Obtener todas las obligaciones (opcionalmente filtradas por socio)',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filtrar por UUID de socio',
  })
  @ApiResponse({ status: 200, description: 'Retornar todas las obligaciones.' })
  findAll(@Query('partnerId') partnerId?: string) {
    if (partnerId) {
      return this.obligationsService.findByPartner(partnerId);
    }
    return this.obligationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una obligación por ID' })
  @ApiResponse({ status: 200, description: 'Retornar la obligación.' })
  @ApiResponse({ status: 404, description: 'Obligación no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.obligationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una obligación' })
  @ApiResponse({ status: 200, description: 'Obligación actualizada.' })
  @ApiResponse({ status: 404, description: 'Obligación no encontrada.' })
  update(
    @Param('id') id: string,
    @Body() updateObligationDto: UpdateObligationDto,
  ) {
    return this.obligationsService.update(id, updateObligationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una obligación' })
  @ApiResponse({ status: 200, description: 'Obligación eliminada.' })
  @ApiResponse({ status: 404, description: 'Obligación no encontrada.' })
  remove(@Param('id') id: string) {
    return this.obligationsService.remove(id);
  }
}
