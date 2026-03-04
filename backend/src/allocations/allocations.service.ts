import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllocationDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the base allocation
      const allocation = await tx.allocation.create({
        data: {
          date: new Date(dto.date),
          accountId: dto.accountId,
          totalAmount: dto.totalAmount,
          status: dto.status,
          notes: dto.notes ?? null,
        },
      });

      // 2. Adjust corresponding Account balance
      await tx.account.update({
        where: { id: dto.accountId },
        data: { currentBalance: { decrement: dto.totalAmount } },
      });

      // (Note: Allocation lines creation and obligation updates are typically handled in a separate endpoint or added to the DTO later. If lines are included in DTO, they would be processed here.)

      return tx.allocation.findUnique({
        where: { id: allocation.id },
        include: {
          account: true,
          allocationLines: true,
          transactions: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.allocation.findMany({
      include: {
        account: true,
        allocationLines: true,
        transactions: {
          select: { id: true, type: true, amount: true, date: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const allocation = await this.prisma.allocation.findUnique({
      where: { id },
      include: {
        account: true,
        allocationLines: {
          include: {
            targetPartner: true,
            targetObligation: true,
            category: true,
          },
        },
        transactions: {
          include: { transactionSources: { include: { source: true } } },
        },
      },
    });
    if (!allocation) {
      throw new NotFoundException(`Allocation with ID ${id} not found`);
    }
    return allocation;
  }

  async update(id: string, dto: UpdateAllocationDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.date) data.date = new Date(dto.date);
    if (dto.accountId) data.accountId = dto.accountId;
    if (dto.totalAmount !== undefined) data.totalAmount = dto.totalAmount;
    if (dto.status) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return this.prisma.allocation.update({
      where: { id },
      data,
      include: { account: true, allocationLines: true },
    });
  }

  async remove(id: string) {
    const allocation = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Revert Account balance
      await tx.account.update({
        where: { id: allocation.accountId },
        data: { currentBalance: { increment: allocation.totalAmount } },
      });

      // 2. Revert Obligations (if any OBLIGATION_PAYMENT lines exist)
      if (allocation.allocationLines && allocation.allocationLines.length > 0) {
        for (const line of allocation.allocationLines) {
          if (
            line.lineType === 'OBLIGATION_PAYMENT' &&
            line.targetObligationId
          ) {
            await tx.obligation.update({
              where: { id: line.targetObligationId },
              data: { remainingAmount: { increment: line.amount } },
            });
          }
        }
      }

      // 3. Delete allocation lines explicitly to satisfy FK constraints if needed (Prisma also handles cascaded delete if configured, but let's be safe)
      await tx.allocationLine.deleteMany({ where: { allocationId: id } });

      // 4. Delete the allocation itself
      return tx.allocation.delete({ where: { id } });
    });
  }
}
