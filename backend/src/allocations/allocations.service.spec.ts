import { AllocationsService } from './allocations.service';

/**
 * In-memory fake of the Prisma calls used by AllocationsService.update: tracks
 * account balances and the EXPENSE "Reparto" transaction linked to the allocation.
 */
function createFakePrisma(seed: {
  accounts: Record<string, number>;
  allocation: {
    id: string;
    accountId: string;
    totalAmount: number;
    date: Date;
  };
}) {
  const accounts = { ...seed.accounts };
  let allocation = { ...seed.allocation, status: 'OPEN', notes: null };
  let linkedTransaction = {
    id: 't1',
    type: 'EXPENSE',
    allocationId: seed.allocation.id,
    amount: seed.allocation.totalAmount,
    accountFromId: seed.allocation.accountId,
    date: seed.allocation.date,
  };

  const prisma: any = {
    allocation: {
      findUnique: jest.fn(() =>
        Promise.resolve({
          ...allocation,
          allocationLines: [],
          transactions: [],
        }),
      ),
      update: jest.fn(({ data }) => {
        allocation = { ...allocation, ...data };
        return Promise.resolve({ ...allocation, allocationLines: [] });
      }),
    },
    account: {
      update: jest.fn(({ where, data }) => {
        const op = data.currentBalance;
        if (op.increment !== undefined)
          accounts[where.id] += Number(op.increment);
        if (op.decrement !== undefined)
          accounts[where.id] -= Number(op.decrement);
        return Promise.resolve({});
      }),
    },
    transaction: {
      updateMany: jest.fn(({ where, data }) => {
        if (
          where.allocationId === linkedTransaction.allocationId &&
          where.type === linkedTransaction.type
        ) {
          linkedTransaction = {
            ...linkedTransaction,
            ...data,
            amount: Number(data.amount ?? linkedTransaction.amount),
          };
        }
        return Promise.resolve({ count: 1 });
      }),
    },
  };
  prisma.$transaction = jest.fn((cb: (tx: any) => unknown) => cb(prisma));

  return { prisma, accounts, getLinkedTransaction: () => linkedTransaction };
}

describe('AllocationsService.update', () => {
  const date = new Date('2026-09-01');

  it('adjusts the account balance and the Reparto movement when the amount changes', async () => {
    // Account had 1.000.000, a reparto of 300.000 left it at 700.000.
    const { prisma, accounts, getLinkedTransaction } = createFakePrisma({
      accounts: { acc: 700_000 },
      allocation: { id: 'al1', accountId: 'acc', totalAmount: 300_000, date },
    });
    const service = new AllocationsService(prisma);

    await service.update('al1', { totalAmount: 500_000 });

    expect(accounts.acc).toBe(500_000);
    expect(getLinkedTransaction().amount).toBe(500_000);
  });

  it('moves the reparto to the new account when the account changes', async () => {
    const { prisma, accounts, getLinkedTransaction } = createFakePrisma({
      accounts: { a: 700_000, b: 1_000_000 },
      allocation: { id: 'al1', accountId: 'a', totalAmount: 300_000, date },
    });
    const service = new AllocationsService(prisma);

    await service.update('al1', { accountId: 'b' });

    expect(accounts).toEqual({ a: 1_000_000, b: 700_000 });
    expect(getLinkedTransaction().accountFromId).toBe('b');
  });

  it('keeps balances unchanged when only status or notes change', async () => {
    const { prisma, accounts, getLinkedTransaction } = createFakePrisma({
      accounts: { acc: 700_000 },
      allocation: { id: 'al1', accountId: 'acc', totalAmount: 300_000, date },
    });
    const service = new AllocationsService(prisma);

    await service.update('al1', { status: 'CLOSED', notes: 'Cerrado' });

    expect(accounts.acc).toBe(700_000);
    expect(getLinkedTransaction().amount).toBe(300_000);
  });

  it('updates the Reparto movement date when the reparto date changes', async () => {
    const { prisma, getLinkedTransaction } = createFakePrisma({
      accounts: { acc: 700_000 },
      allocation: { id: 'al1', accountId: 'acc', totalAmount: 300_000, date },
    });
    const service = new AllocationsService(prisma);

    await service.update('al1', { date: '2026-09-15' });

    expect(getLinkedTransaction().date).toEqual(new Date('2026-09-15'));
  });
});
