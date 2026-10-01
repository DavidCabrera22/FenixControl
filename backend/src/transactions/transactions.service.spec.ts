import { Prisma } from '@prisma/client';
import { TransactionsService } from './transactions.service';

/**
 * In-memory fake of the Prisma calls used by TransactionsService, applying
 * increment/decrement operations so tests can assert resulting balances.
 */
function createFakePrisma(seed: {
  accounts: Record<string, number>;
  sources: Record<string, number>;
  transaction: {
    id: string;
    type: string;
    amount: number;
    accountFromId: string | null;
    accountToId: string | null;
    transactionSources: { sourceId: string; amount: number }[];
  };
}) {
  const accounts = { ...seed.accounts };
  const sources = { ...seed.sources };
  let stored = {
    ...seed.transaction,
    transactionSources: [...seed.transaction.transactionSources],
  };

  const applyDelta = (
    balances: Record<string, number>,
    id: string,
    op: { increment?: unknown; decrement?: unknown },
  ) => {
    if (op.increment !== undefined) balances[id] += Number(op.increment);
    if (op.decrement !== undefined) balances[id] -= Number(op.decrement);
  };

  const prisma: any = {
    account: {
      update: jest.fn(({ where, data }) => {
        applyDelta(accounts, where.id, data.currentBalance);
        return Promise.resolve({});
      }),
    },
    source: {
      update: jest.fn(({ where, data }) => {
        applyDelta(sources, where.id, data.currentBalance);
        return Promise.resolve({});
      }),
    },
    transactionSource: {
      deleteMany: jest.fn(() => {
        stored.transactionSources = [];
        return Promise.resolve({});
      }),
      createMany: jest.fn(({ data }) => {
        stored.transactionSources = data.map((d: any) => ({
          sourceId: d.sourceId,
          amount: Number(d.amount),
        }));
        return Promise.resolve({});
      }),
    },
    transaction: {
      findUnique: jest.fn(() => Promise.resolve({ ...stored })),
      update: jest.fn(({ data }) => {
        stored = {
          ...stored,
          ...data,
          amount: Number(data.amount ?? stored.amount),
        };
        return Promise.resolve({ ...stored });
      }),
    },
  };
  prisma.$transaction = jest.fn((cb: (tx: any) => unknown) => cb(prisma));

  return { prisma, accounts, sources };
}

describe('TransactionsService.update', () => {
  it('moves the account balance by the difference when the amount is edited', async () => {
    // Account created with 50.000.000, then an INCOME of 300 was registered by mistake
    // and later edited to 50.000.000: balance must follow the edited amount.
    const { prisma, accounts } = createFakePrisma({
      accounts: { acc: 50_000_300 },
      sources: {},
      transaction: {
        id: 't1',
        type: 'INCOME',
        amount: 300,
        accountFromId: null,
        accountToId: 'acc',
        transactionSources: [],
      },
    });
    const service = new TransactionsService(prisma);

    await service.update('t1', { amount: 1_000 });

    expect(accounts.acc).toBe(50_001_000);
  });

  it('moves the balance to the new account when the account is changed', async () => {
    const { prisma, accounts } = createFakePrisma({
      accounts: { a: 1_000, b: 0 },
      sources: {},
      transaction: {
        id: 't1',
        type: 'EXPENSE',
        amount: 200,
        accountFromId: 'a',
        accountToId: null,
        transactionSources: [],
      },
    });
    const service = new TransactionsService(prisma);

    await service.update('t1', { accountFromId: 'b' });

    expect(accounts).toEqual({ a: 1_200, b: -200 });
  });

  it('re-applies source balances when amount and sources are edited', async () => {
    const { prisma, sources } = createFakePrisma({
      accounts: { acc: 0 },
      sources: { s1: 500, s2: 0 },
      transaction: {
        id: 't1',
        type: 'INCOME',
        amount: 500,
        accountFromId: null,
        accountToId: 'acc',
        transactionSources: [{ sourceId: 's1', amount: 500 }],
      },
    });
    const service = new TransactionsService(prisma);

    await service.update('t1', {
      amount: 800,
      sources: [{ sourceId: 's2', amount: 800 }],
    });

    expect(sources).toEqual({ s1: 0, s2: 800 });
  });

  it('accepts Prisma Decimal amounts from the stored transaction', async () => {
    const { prisma, accounts } = createFakePrisma({
      accounts: { acc: 300 },
      sources: {},
      transaction: {
        id: 't1',
        type: 'INCOME',
        amount: new Prisma.Decimal(300) as unknown as number,
        accountFromId: null,
        accountToId: 'acc',
        transactionSources: [],
      },
    });
    const service = new TransactionsService(prisma);

    await service.update('t1', { amount: 300 });

    expect(accounts.acc).toBe(300);
  });
});
