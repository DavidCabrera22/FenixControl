# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fenix Control is a financial management application (monorepo) with a NestJS backend and React/Vite frontend, deployed on Railway. It manages financial transactions, obligations, allocations, accounts, partners, and categories.

## Commands

### Backend (`/backend`)

```bash
npm run start:dev       # Development with hot reload
npm run build           # Compile TypeScript to /dist
npm run start:prod      # Run compiled production build
npm run lint            # ESLint with auto-fix
npm run test            # Run unit tests (Jest)
npm run test:watch      # Jest in watch mode
npm run test:cov        # Jest with coverage
npm run test:e2e        # End-to-end tests
npx jest path/to/file.spec.ts  # Run a single test file
```

Prisma commands:
```bash
npx prisma migrate dev       # Apply migrations in development
npx prisma db push           # Push schema changes without migration
npx prisma studio            # Open Prisma GUI
npx prisma db seed           # Seed database (ts-node prisma/seed.ts)
```

### Frontend (`/frontend`)

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # tsc + vite build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

## Environment

- **Backend** (`backend/.env`): Requires `DATABASE_URL` (PostgreSQL connection string)
- **Frontend** (`frontend/.env`): Requires `VITE_API_URL` pointing to the backend (defaults to `http://localhost:3000`)

## Architecture

### Backend (NestJS)

`src/main.ts` bootstraps the app with:
- Global `ValidationPipe` (whitelist + transform)
- CORS enabled
- Swagger docs at `/api/docs`
- Listens on `process.env.PORT ?? 3000`

Feature modules in `src/app.module.ts`: `PrismaModule`, `AuthModule`, `UsersModule`, `PartnersModule`, `AccountsModule`, `SourcesModule`, `CategoriesModule`, `TransactionsModule`, `ObligationsModule`, `AllocationsModule`.

Each module follows the NestJS pattern: `module.ts` → `controller.ts` → `service.ts`. The `PrismaService` (injected via `PrismaModule`) is the only database access layer — no repositories.

### Database (Prisma + PostgreSQL)

Schema in `backend/prisma/schema.prisma`. Core domain entities:
- **Account** / **Source** — financial accounts and transaction origins, both track `currentBalance`
- **Transaction** — has `accountFromId`/`accountToId`, optional `allocationId`; links to multiple sources via `TransactionSource` junction table
- **Allocation** + **AllocationLine** — fund allocation groups; lines can target accounts, partners, or obligations with a `lineType`
- **Obligation** — debts with `remainingAmount`, `interestRate`, `status`
- **Partner** — external entities linked to sources and obligations
- **Category** — typed labels for transactions and allocation lines

### Frontend (React + Vite)

`src/main.tsx` sets `axios.defaults.baseURL` from `VITE_API_URL` then mounts `<App/>`.

`src/App.tsx` uses React Router v7 with a `ProtectedRoute` wrapper that checks `localStorage` for a token.

**Route → Page mapping:**
- `/` → `Dashboard.tsx`
- `/transactions` → `Transactions.tsx`
- `/allocations` → `Allocations.tsx`
- `/obligations` → `Obligaciones.tsx`
- `/obligations/movements` → `ObligationMovements.tsx`
- `/reports` → `Reports.tsx`
- `/settings` → `Settings.tsx`

Pages manage state locally and open feature modals (e.g., `TransactionModal`, `AllocationModal`, `ObligationModal`). Shared UI: `MainLayout` (sidebar + topbar), `SearchableSelect`.

Auth: `POST /auth/login` returns a JWT stored in `localStorage`; `POST /auth/register` for new users.

Styling: Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Icons: Material Symbols loaded via HTML link tag in `index.html` (used as `<span class="material-symbols-outlined">`).

PDF export (`/reports`): `html2canvas` + `jspdf`.
Charts: `recharts`.

### Static HTML

`frontend/stitch/dashboard.html` is a standalone HTML prototype/mockup — it is not part of the Vite build.
