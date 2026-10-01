import { AccountsService } from './accounts.service';

function createFakePrisma(account: {
  initialBalance: number;
  currentBalance: number;
}) {
  let stored: Record<string, unknown> = {
    id: 'acc',
    name: 'Cuenta',
    type: 'BANK',
    ...account,
  };
  const prisma: any = {
    account: {
      findUnique: jest.fn(() => Promise.resolve({ ...stored })),
      update: jest.fn(({ data }) => {
        const next = { ...stored };
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'increment' in value) {
            next[key] = Number(stored[key]) + Number((value as any).increment);
          } else {
            next[key] = value;
          }
        }
        stored = next;
        return Promise.resolve({ ...stored });
      }),
    },
  };
  return { prisma, get: () => stored };
}

describe('AccountsService.update', () => {
  it('shifts the current balance by the change in initial balance, keeping movements', async () => {
    // Initial 300, then a 1.000 income: current = 1.300. Fixing initial to 500 → 1.500.
    const { prisma, get } = createFakePrisma({
      initialBalance: 300,
      currentBalance: 1_300,
    });
    const service = new AccountsService(prisma);

    await service.update('acc', { initialBalance: 500 });

    expect(Number(get().initialBalance)).toBe(500);
    expect(Number(get().currentBalance)).toBe(1_500);
  });

  it('ignores a client-sent currentBalance so movements are never wiped', async () => {
    const { prisma, get } = createFakePrisma({
      initialBalance: 300,
      currentBalance: 1_300,
    });
    const service = new AccountsService(prisma);

    await service.update('acc', { initialBalance: 300, currentBalance: 300 });

    expect(Number(get().currentBalance)).toBe(1_300);
  });

  it('leaves balances untouched when only the name changes', async () => {
    const { prisma, get } = createFakePrisma({
      initialBalance: 300,
      currentBalance: 1_300,
    });
    const service = new AccountsService(prisma);

    await service.update('acc', { name: 'Nueva' });

    expect(get().name).toBe('Nueva');
    expect(Number(get().currentBalance)).toBe(1_300);
  });
});
