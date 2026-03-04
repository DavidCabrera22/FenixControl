import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Transaction record
      const transaction = await tx.transaction.create({
        data: {
          date: new Date(dto.date),
          type: dto.type,
          amount: dto.amount,
          accountFromId: dto.accountFromId ?? null,
          accountToId: dto.accountToId ?? null,
          categoryId: dto.categoryId ?? null,
          allocationId: dto.allocationId ?? null,
          description: dto.description ?? null,
          thirdPartyName: dto.thirdPartyName ?? null,
          attachmentUrl: dto.attachmentUrl ?? null,
        },
      });

      // 2. Adjust Account Balances
      if (dto.type === 'EXPENSE' && dto.accountFromId) {
        await tx.account.update({
          where: { id: dto.accountFromId },
          data: { currentBalance: { decrement: dto.amount } },
        });
      } else if (dto.type === 'INCOME' && dto.accountToId) {
        await tx.account.update({
          where: { id: dto.accountToId },
          data: { currentBalance: { increment: dto.amount } },
        });
      } else if (
        dto.type === 'TRANSFER' &&
        dto.accountFromId &&
        dto.accountToId
      ) {
        await tx.account.update({
          where: { id: dto.accountFromId },
          data: { currentBalance: { decrement: dto.amount } },
        });
        await tx.account.update({
          where: { id: dto.accountToId },
          data: { currentBalance: { increment: dto.amount } },
        });
      }

      // 3. Handle Sources and Adjust Source Balances
      if (dto.sources && dto.sources.length > 0) {
        await tx.transactionSource.createMany({
          data: dto.sources.map((s) => ({
            transactionId: transaction.id,
            sourceId: s.sourceId,
            amount: s.amount,
          })),
        });

        for (const sourceItem of dto.sources) {
          if (dto.type === 'EXPENSE') {
            await tx.source.update({
              where: { id: sourceItem.sourceId },
              data: { currentBalance: { decrement: sourceItem.amount } },
            });
          } else if (dto.type === 'INCOME') {
            await tx.source.update({
              where: { id: sourceItem.sourceId },
              data: { currentBalance: { increment: sourceItem.amount } },
            });
          }
        }
      }

      // 4. Return updated transaction with relations
      return tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          accountFrom: true,
          accountTo: true,
          category: true,
          transactionSources: { include: { source: true } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        accountFrom: true,
        accountTo: true,
        category: true,
        transactionSources: { include: { source: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        accountFrom: true,
        accountTo: true,
        category: true,
        transactionSources: {
          include: { source: { include: { partner: true } } },
        },
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.date) data.date = new Date(dto.date);
    if (dto.type) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.accountFromId !== undefined) data.accountFromId = dto.accountFromId;
    if (dto.accountToId !== undefined) data.accountToId = dto.accountToId;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.allocationId !== undefined) data.allocationId = dto.allocationId;
    
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.thirdPartyName !== undefined) data.thirdPartyName = dto.thirdPartyName || null;
    if (dto.attachmentUrl !== undefined) data.attachmentUrl = dto.attachmentUrl || null;

    return this.prisma.transaction.update({
      where: { id },
      data,
      include: {
        accountFrom: true,
        accountTo: true,
        category: true,
        transactionSources: { include: { source: true } },
      },
    });
  }

  async remove(id: string) {
    const transaction = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Revert Account Balances
      if (transaction.type === 'EXPENSE' && transaction.accountFromId) {
        await tx.account.update({
          where: { id: transaction.accountFromId },
          data: { currentBalance: { increment: transaction.amount } },
        });
      } else if (transaction.type === 'INCOME' && transaction.accountToId) {
        await tx.account.update({
          where: { id: transaction.accountToId },
          data: { currentBalance: { decrement: transaction.amount } },
        });
      } else if (
        transaction.type === 'TRANSFER' &&
        transaction.accountFromId &&
        transaction.accountToId
      ) {
        await tx.account.update({
          where: { id: transaction.accountFromId },
          data: { currentBalance: { increment: transaction.amount } },
        });
        await tx.account.update({
          where: { id: transaction.accountToId },
          data: { currentBalance: { decrement: transaction.amount } },
        });
      }

      // 2. Revert Source Balances
      if (
        transaction.transactionSources &&
        transaction.transactionSources.length > 0
      ) {
        for (const sourceItem of transaction.transactionSources) {
          if (transaction.type === 'EXPENSE') {
            await tx.source.update({
              where: { id: sourceItem.sourceId },
              data: { currentBalance: { increment: sourceItem.amount } },
            });
          } else if (transaction.type === 'INCOME') {
            await tx.source.update({
              where: { id: sourceItem.sourceId },
              data: { currentBalance: { decrement: sourceItem.amount } },
            });
          }
        }
      }

      // 3. Delete records
      await tx.transactionSource.deleteMany({ where: { transactionId: id } });
      return tx.transaction.delete({ where: { id } });
    });
  }
}
