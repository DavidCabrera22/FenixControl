import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production seed...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('FenixProd2026!@$', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fenix.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@fenix.com',
      password: adminPassword,
    },
  });
  console.log('✅ Admin user ensured.');

  // 2. Core Categories (Categorías base necesarias para el sistema)
  const coreCategories = [
    { name: 'Ventas / Honorarios', type: 'INCOME' },
    { name: 'Aportes de Capital', type: 'INCOME' },
    { name: 'Otros Ingresos', type: 'INCOME' },
    { name: 'Gastos Operativos', type: 'EXPENSE' },
    { name: 'Nómina', type: 'EXPENSE' },
    { name: 'Pago de Impuestos', type: 'EXPENSE' },
    { name: 'Servicios Públicos', type: 'EXPENSE' },
    { name: 'Transferencia entre Cuentas', type: 'TRANSFER' },
    { name: 'Ajuste de Saldo', type: 'ADJUSTMENT' },
  ];

  for (const cat of coreCategories) {
    // Upsert by name to avoid duplicates if seed is run multiple times
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({
        data: { name: cat.name, type: cat.type },
      });
    }
  }
  console.log('✅ Core categories ensured.');

  console.log('----------------------------------------------------');
  console.log('Seed completed successfully. Database is ready for production!');
  console.log('Admin Email: admin@fenix.com');
  console.log('Admin Password: FenixProd2026!@$');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
