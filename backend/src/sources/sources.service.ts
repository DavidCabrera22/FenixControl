import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSourceDto: CreateSourceDto) {
    return this.prisma.source.create({
      data: {
        name: createSourceDto.name,
        type: createSourceDto.type,
        initialBalance: createSourceDto.initialBalance,
        currentBalance: createSourceDto.currentBalance,
        partnerId: createSourceDto.partnerId,
      },
      include: { partner: true },
    });
  }

  async findAll() {
    return this.prisma.source.findMany({ include: { partner: true } });
  }

  async findByPartner(partnerId: string) {
    return this.prisma.source.findMany({
      where: { partnerId },
      include: { partner: true },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }
    return source;
  }

  async update(id: string, updateSourceDto: UpdateSourceDto) {
    const source = await this.findOne(id);
    // currentBalance is derived from movements: never overwrite it from the client.
    // Changing the initial balance shifts the current balance by the same difference.
    const data = { ...updateSourceDto };
    delete data.currentBalance;
    return this.prisma.source.update({
      where: { id },
      data: {
        ...data,
        ...(data.initialBalance !== undefined && {
          currentBalance: {
            increment: new Prisma.Decimal(data.initialBalance).minus(
              source.initialBalance,
            ),
          },
        }),
      },
      include: { partner: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.source.delete({ where: { id } });
  }
}
