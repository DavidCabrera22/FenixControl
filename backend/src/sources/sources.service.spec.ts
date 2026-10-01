import { SourcesService } from './sources.service';

function createFakePrisma(source: {
  initialBalance: number;
  currentBalance: number;
}) {
  let stored: Record<string, unknown> = {
    id: 'src',
    name: 'Fuente',
    type: 'INCOME',
    partnerId: 'p',
    ...source,
  };
  const prisma: any = {
    source: {
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

describe('SourcesService.update', () => {
  it('keeps movements when the edit form resends currentBalance = initialBalance', async () => {
    // Initial 300 plus 1.000 of movements; the form resends both balances as 300.
    const { prisma, get } = createFakePrisma({
      initialBalance: 300,
      currentBalance: 1_300,
    });
    const service = new SourcesService(prisma);

    await service.update('src', { initialBalance: 300, currentBalance: 300 });

    expect(Number(get().currentBalance)).toBe(1_300);
  });

  it('shifts the current balance by the change in initial balance', async () => {
    const { prisma, get } = createFakePrisma({
      initialBalance: 300,
      currentBalance: 1_300,
    });
    const service = new SourcesService(prisma);

    await service.update('src', { initialBalance: 100, currentBalance: 100 });

    expect(Number(get().initialBalance)).toBe(100);
    expect(Number(get().currentBalance)).toBe(1_100);
  });
});
