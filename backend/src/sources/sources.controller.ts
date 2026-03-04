import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@ApiTags('Sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva fuente virtual (bolsillo)' })
  @ApiResponse({ status: 201, description: 'Fuente creada.' })
  create(@Body() createSourceDto: CreateSourceDto) {
    return this.sourcesService.create(createSourceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todas las fuentes (opcionalmente filtradas por socio)',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filtrar por UUID de socio',
  })
  @ApiResponse({ status: 200, description: 'Retornar todas las fuentes.' })
  findAll(@Query('partnerId') partnerId?: string) {
    if (partnerId) {
      return this.sourcesService.findByPartner(partnerId);
    }
    return this.sourcesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una fuente por ID' })
  @ApiResponse({ status: 200, description: 'Retornar la fuente.' })
  @ApiResponse({ status: 404, description: 'Fuente no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una fuente' })
  @ApiResponse({ status: 200, description: 'Fuente actualizada.' })
  @ApiResponse({ status: 404, description: 'Fuente no encontrada.' })
  update(@Param('id') id: string, @Body() updateSourceDto: UpdateSourceDto) {
    return this.sourcesService.update(id, updateSourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una fuente' })
  @ApiResponse({ status: 200, description: 'Fuente eliminada.' })
  @ApiResponse({ status: 404, description: 'Fuente no encontrada.' })
  remove(@Param('id') id: string) {
    return this.sourcesService.remove(id);
  }
}
