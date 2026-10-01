import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        name: createAccountDto.name,
        type: createAccountDto.type,
        initialBalance: createAccountDto.initialBalance,
        currentBalance: createAccountDto.currentBalance,
      },
    });
  }

  async findAll() {
    return this.prisma.account.findMany();
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    const account = await this.findOne(id);
    // currentBalance is derived from movements: never overwrite it from the client.
    // Changing the initial balance shifts the current balance by the same difference.
    const data = { ...updateAccountDto };
    delete data.currentBalance;
    return this.prisma.account.update({
      where: { id },
      data: {
        ...data,
        ...(data.initialBalance !== undefined && {
          currentBalance: {
            increment: new Prisma.Decimal(data.initialBalance).minus(
              account.initialBalance,
            ),
          },
        }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.account.delete({ where: { id } });
  }
}
