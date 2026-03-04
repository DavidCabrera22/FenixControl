import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateObligationDto } from './dto/create-obligation.dto';
import { UpdateObligationDto } from './dto/update-obligation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ObligationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createObligationDto: CreateObligationDto) {
    return this.prisma.obligation.create({
      data: {
        name: createObligationDto.name,
        type: createObligationDto.type,
        partnerId: createObligationDto.partnerId,
        initialAmount: createObligationDto.initialAmount,
        remainingAmount: createObligationDto.remainingAmount,
        interestRate: createObligationDto.interestRate,
        dueDate: new Date(createObligationDto.dueDate),
        status: createObligationDto.status,
      },
      include: { partner: true },
    });
  }

  async findAll() {
    return this.prisma.obligation.findMany({ include: { partner: true } });
  }

  async findByPartner(partnerId: string) {
    return this.prisma.obligation.findMany({
      where: { partnerId },
      include: { partner: true },
    });
  }

  async findOne(id: string) {
    const obligation = await this.prisma.obligation.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!obligation) {
      throw new NotFoundException(`Obligation with ID ${id} not found`);
    }
    return obligation;
  }

  async update(id: string, updateObligationDto: UpdateObligationDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...updateObligationDto };
    if (updateObligationDto.dueDate) {
      data.dueDate = new Date(updateObligationDto.dueDate);
    }
    return this.prisma.obligation.update({
      where: { id },
      data,
      include: { partner: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.obligation.delete({ where: { id } });
  }
}
