import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AllocationsService } from './allocations.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@ApiTags('Allocations')
@Controller('allocations')
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un reparto o distribución temporal' })
  @ApiResponse({ status: 201, description: 'Reparto creado.' })
  create(@Body() createAllocationDto: CreateAllocationDto) {
    return this.allocationsService.create(createAllocationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los repartos (más recientes primero)',
  })
  @ApiResponse({ status: 200, description: 'Retornar todos los repartos.' })
  findAll() {
    return this.allocationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un reparto por ID (con líneas y movimientos)',
  })
  @ApiResponse({ status: 200, description: 'Retornar el reparto.' })
  @ApiResponse({ status: 404, description: 'Reparto no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.allocationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un reparto' })
  @ApiResponse({ status: 200, description: 'Reparto actualizado.' })
  @ApiResponse({ status: 404, description: 'Reparto no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateAllocationDto: UpdateAllocationDto,
  ) {
    return this.allocationsService.update(id, updateAllocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un reparto' })
  @ApiResponse({ status: 200, description: 'Reparto eliminado.' })
  @ApiResponse({ status: 404, description: 'Reparto no encontrado.' })
  remove(@Param('id') id: string) {
    return this.allocationsService.remove(id);
  }
}
