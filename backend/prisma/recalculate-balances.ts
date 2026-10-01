/**
 * Recalculates account and source current balances from their movements.
 *
 *   npx ts-node prisma/recalculate-balances.ts           # dry run: only lists differences
 *   npx ts-node prisma/recalculate-balances.ts --apply   # writes the corrected balances
 *
 * Account: initialBalance + INCOME (accountTo) − EXPENSE (accountFrom) ± TRANSFER.
 * Source:  initialBalance + INCOME sources − EXPENSE sources.
 * Allocations are covered because each one creates its EXPENSE transaction.
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const fmt = (d: Prisma.Decimal) =>
  Number(d).toLocaleString('es-CO', { maximumFractionDigits: 2 });

async function main() {
  const [accounts, sources, transactions, transactionSources] =
    await Promise.all([
      prisma.account.findMany(),
      prisma.source.findMany(),
      prisma.transaction.findMany(),
      prisma.transactionSource.findMany({ include: { transaction: true } }),
    ]);

  const accountTotals = new Map<string, Prisma.Decimal>();
  const add = (
    map: Map<string, Prisma.Decimal>,
    id: string,
    v: Prisma.Decimal,
  ) => map.set(id, (map.get(id) ?? new Prisma.Decimal(0)).plus(v));

  for (const t of transactions) {
    const amount = new Prisma.Decimal(t.amount);
    if (t.type === 'INCOME' && t.accountToId)
      add(accountTotals, t.accountToId, amount);
    else if (t.type === 'EXPENSE' && t.accountFromId)
      add(accountTotals, t.accountFromId, amount.neg());
    else if (t.type === 'TRANSFER' && t.accountFromId && t.accountToId) {
      add(accountTotals, t.accountFromId, amount.neg());
      add(accountTotals, t.accountToId, amount);
    }
  }

  const sourceTotals = new Map<string, Prisma.Decimal>();
  for (const ts of transactionSources) {
    const amount = new Prisma.Decimal(ts.amount);
    if (ts.transaction.type === 'INCOME')
      add(sourceTotals, ts.sourceId, amount);
    else if (ts.transaction.type === 'EXPENSE')
      add(sourceTotals, ts.sourceId, amount.neg());
  }

  let differences = 0;
  const check = async (
    kind: 'Cuenta' | 'Fuente',
    item: {
      id: string;
      name: string;
      initialBalance: Prisma.Decimal;
      currentBalance: Prisma.Decimal;
    },
    totals: Map<string, Prisma.Decimal>,
  ) => {
    const expected = new Prisma.Decimal(item.initialBalance).plus(
      totals.get(item.id) ?? 0,
    );
    if (expected.equals(item.currentBalance)) return;
    differences++;
    console.log(
      `${kind} "${item.name}": actual ${fmt(item.currentBalance)} → correcto ${fmt(expected)} ` +
        `(diferencia ${fmt(new Prisma.Decimal(item.currentBalance).minus(expected))})`,
    );
    if (!apply) return;
    if (kind === 'Cuenta') {
      await prisma.account.update({
        where: { id: item.id },
        data: { currentBalance: expected },
      });
    } else {
      await prisma.source.update({
        where: { id: item.id },
        data: { currentBalance: expected },
      });
    }
  };

  for (const a of accounts) await check('Cuenta', a, accountTotals);
  for (const s of sources) await check('Fuente', s, sourceTotals);

  if (differences === 0)
    console.log('Todos los saldos cuadran con sus movimientos.');
  else if (!apply)
    console.log(
      `\n${differences} saldo(s) descuadrado(s). Ejecuta con --apply para corregirlos.`,
    );
  else console.log(`\n${differences} saldo(s) corregido(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
