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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Transactions')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un movimiento (con divisiones de fuentes opcionales)',
  })
  @ApiResponse({ status: 201, description: 'Movimiento creado.' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los movimientos (más recientes primero)',
  })
  @ApiResponse({ status: 200, description: 'Retornar todos los movimientos.' })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un movimiento por ID (con fuentes asociadas)',
  })
  @ApiResponse({ status: 200, description: 'Retornar el movimiento.' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un movimiento' })
  @ApiResponse({ status: 200, description: 'Movimiento actualizado.' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un movimiento (también elimina vínculos de fuentes)',
  })
  @ApiResponse({ status: 200, description: 'Movimiento eliminado.' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado.' })
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }
}
