import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';
import { CreateAllocationLineDto } from './dto/create-allocation-line.dto';
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

      // 3. Create an EXPENSE transaction record for visibility in Movements
      let repartoCategory = await tx.category.findFirst({ where: { name: 'Reparto' } });
      if (!repartoCategory) {
        repartoCategory = await tx.category.create({ data: { name: 'Reparto', type: 'EXPENSE' } });
      }

      await tx.transaction.create({
        data: {
          date: new Date(dto.date),
          type: 'EXPENSE',
          amount: dto.totalAmount,
          accountFromId: dto.accountId,
          allocationId: allocation.id,
          categoryId: repartoCategory.id,
          description: dto.notes ?? 'Reparto',
        },
      });

      // 4. Create allocation lines if provided
      if (dto.lines && dto.lines.length > 0) {
        for (const line of dto.lines) {
          await tx.allocationLine.create({
            data: {
              allocationId: allocation.id,
              lineType: line.lineType,
              amount: line.amount,
              targetAccountId: line.targetAccountId ?? null,
              targetPartnerId: line.targetPartnerId ?? null,
              targetObligationId: line.targetObligationId ?? null,
              categoryId: line.categoryId ?? null,
              notes: line.notes ?? null,
            },
          });

          // If this line pays an obligation, decrement its remaining amount
          if (line.lineType === 'OBLIGATION_PAYMENT' && line.targetObligationId) {
            await tx.obligation.update({
              where: { id: line.targetObligationId },
              data: { remainingAmount: { decrement: line.amount } },
            });
          }
        }
      }

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

  async addLine(allocationId: string, dto: CreateAllocationLineDto) {
    await this.findOne(allocationId);
    return this.prisma.$transaction(async (tx) => {
      const line = await tx.allocationLine.create({
        data: {
          allocationId,
          lineType: dto.lineType,
          amount: dto.amount,
          targetAccountId: dto.targetAccountId ?? null,
          targetPartnerId: dto.targetPartnerId ?? null,
          targetObligationId: dto.targetObligationId ?? null,
          categoryId: dto.categoryId ?? null,
          notes: dto.notes ?? null,
        },
      });

      if (dto.lineType === 'OBLIGATION_PAYMENT' && dto.targetObligationId) {
        await tx.obligation.update({
          where: { id: dto.targetObligationId },
          data: { remainingAmount: { decrement: dto.amount } },
        });
      }

      return line;
    });
  }

  async removeLine(allocationId: string, lineId: string) {
    const line = await this.prisma.allocationLine.findFirst({
      where: { id: lineId, allocationId },
    });
    if (!line) {
      throw new NotFoundException(`Allocation line ${lineId} not found`);
    }
    return this.prisma.$transaction(async (tx) => {
      if (line.lineType === 'OBLIGATION_PAYMENT' && line.targetObligationId) {
        await tx.obligation.update({
          where: { id: line.targetObligationId },
          data: { remainingAmount: { increment: line.amount } },
        });
      }
      return tx.allocationLine.delete({ where: { id: lineId } });
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

      // 3. Delete allocation lines
      await tx.allocationLine.deleteMany({ where: { allocationId: id } });

      // 4. Delete the linked EXPENSE transaction record (balance already reverted above)
      await tx.transaction.deleteMany({
        where: { allocationId: id, type: 'EXPENSE' },
      });

      // 5. Delete the allocation itself
      return tx.allocation.delete({ where: { id } });
    });
  }
}
