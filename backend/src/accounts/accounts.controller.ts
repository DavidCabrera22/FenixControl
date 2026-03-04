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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cuenta (banco o efectivo)' })
  @ApiResponse({ status: 201, description: 'Cuenta creada.' })
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las cuentas' })
  @ApiResponse({ status: 200, description: 'Retornar todas las cuentas.' })
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Retornar la cuenta.' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta actualizada.' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada.' })
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada.' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada.' })
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
