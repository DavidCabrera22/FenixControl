import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';

// Type definitions based on the backend schema
interface Transaction {
  id: string;
  sourceId: string;
  categoryId: string;
  type: 'INCOME' | 'EXPENSE' | 'ALLOCATION' | 'LOAN';
  amount: number;
  description: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  category?: { name: string };
  categoryRel?: { name: string, color: string };
  sourceRel?: { name: string };
}

interface Account {
  id: string;
  name: string;
  currentBalance: number;
  type: 'OPERATIONAL' | 'SAVINGS' | 'CREDIT' | 'CASH';
}

interface Obligation {
  id: string;
  remainingAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

interface DashboardAnalytics {
  totalBalance: number;
  monthIncome: number;
  monthExpenses: number;
  pendingDebt: number;
  incomeDiff: number;
  expenseDiff: number;
  pendingCount: number;
}

const ACCOUNT_COLORS = [
  { barClass: 'bg-primary' },
  { barClass: 'bg-emerald-500' },
  { barClass: 'bg-indigo-400' },
  { barClass: 'bg-blue-400' },
  { barClass: 'bg-rose-400' },
  { barClass: 'bg-amber-400' },
];

const ACCOUNT_TYPES_ES = {
  OPERATIONAL: 'Operativa',
  SAVINGS: 'Ahorros',
  CREDIT: 'Crédito',
  CASH: 'Caja',
};

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalBalance: 0,
    monthIncome: 0,
    monthExpenses: 0,
    pendingDebt: 0,
    incomeDiff: 0,
    expenseDiff: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [txRes, accRes, obRes] = await Promise.all([
        axios.get(" /transactions " ),
        axios.get(" /accounts " ),
        axios.get(" /obligations " )
      ]);
      
      const txs: Transaction[] = txRes.data;
      const fetchedAccounts: Account[] = accRes.data;
      const obligations: Obligation[] = obRes.data;
      
      // Calculate Analytics
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthTxs = txs.filter(tx => {
        const d = new Date(tx.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const lastMonthTxs = txs.filter(tx => {
        const d = new Date(tx.createdAt);
        const isLastMonth = currentMonth === 0 
           ? d.getMonth() === 11 && d.getFullYear() === currentYear - 1 
           : d.getMonth() === currentMonth - 1 && d.getFullYear() === currentYear;
        return isLastMonth;
      });

      // Income vs Expenses
      const monthIncome = currentMonthTxs.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
      const monthExpenses = currentMonthTxs.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
      const lastMonthIncome = lastMonthTxs.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
      const lastMonthExpenses = lastMonthTxs.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);

      const incomeDiff = lastMonthIncome === 0 ? (monthIncome > 0 ? 100 : 0) : ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100;
      const expenseDiff = lastMonthExpenses === 0 ? (monthExpenses > 0 ? 100 : 0) : ((monthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;

      // Calculate Pending Debt from Obligations
      const activeObligations = obligations.filter(ob => Number(ob.remainingAmount) > 0);
      const pendingCount = activeObligations.length;
      const pendingDebt = activeObligations.reduce((sum, ob) => sum + Number(ob.remainingAmount), 0);

      // Total Accounts Balance
      const totalBalance = fetchedAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

      setTransactions(txs.slice(0, 8)); // Get latest 8
      setAccounts(fetchedAccounts);
      setAnalytics({ totalBalance, monthIncome, monthExpenses, pendingDebt, incomeDiff, expenseDiff, pendingCount });
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalAccountsBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title & New Button */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resumen</h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Vista general del período seleccionado</p>
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 bg-primary text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm md:text-base">
            <span className="material-symbols-outlined">add</span>
            <span className="hidden sm:inline">Nuevo</span>
            <span className="material-symbols-outlined text-sm hidden sm:inline">expand_more</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium text-xs md:text-sm">Saldo Total</span>
              <div className="p-1.5 md:p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">account_balance_wallet</span>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(analytics.totalBalance)}</p>
          </div>
          <div className="mt-4 flex items-center text-emerald-600 text-xs md:text-sm font-bold">
            <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
            <span>+4.2% este mes</span>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium text-xs md:text-sm">Deudas Pendientes</span>
              <div className="p-1.5 md:p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">pending_actions</span>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(analytics.pendingDebt)}</p>
          </div>
          <div className="mt-4">
            <span className="px-2 md:px-2.5 py-0.5 md:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
              {analytics.pendingCount} Pendiente{analytics.pendingCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 font-medium text-xs md:text-sm">Neto del Mes</span>
              <div className="p-1.5 md:p-2 bg-primary/5 dark:bg-primary/20 text-primary dark:text-slate-300 rounded-lg">
                <span className="material-symbols-outlined text-[18px] md:text-[24px]">insights</span>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{formatCurrency(analytics.monthIncome - analytics.monthExpenses)}</p>
          </div>
          <div className={clsx("mt-4 flex items-center text-xs md:text-sm font-bold", analytics.incomeDiff >= 0 ? "text-primary dark:text-primary" : "text-rose-500")}>
            <span className="material-symbols-outlined text-sm mr-1">{analytics.incomeDiff >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
            <span>{analytics.incomeDiff >= 0 ? '+' : ''}{analytics.incomeDiff.toFixed(1)}% vs mes anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Table Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Actividad Reciente</h3>
              <button className="text-xs md:text-sm font-bold text-primary dark:text-slate-300 hover:underline">Descargar CSV</button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Cargando movimientos...</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-500">No hay movimientos recientes</td></tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                          <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <span className={clsx(
                              "px-2 py-1 text-[9px] md:text-[10px] font-black rounded uppercase",
                              tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                              tx.type === 'ALLOCATION' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                              'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            )}>
                              {tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : tx.type === 'ALLOCATION' ? 'Reparto' : 'Préstamo'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <span className="font-semibold text-xs md:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{tx.category?.name || 'Movimiento'}</span>
                          </td>
                          <td className={clsx("px-4 md:px-6 py-3 md:py-4 text-right font-bold text-xs md:text-base whitespace-nowrap",
                            tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 
                            tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          )}>
                            {tx.type === 'EXPENSE' ? '-' : ''}{formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4">
                            <div className={clsx("flex items-center gap-1.5 text-[10px] md:text-xs font-bold",
                              tx.status === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' :
                              tx.status === 'PENDING' ? 'text-amber-500' : 'text-slate-400'
                            )}>
                              <span className={clsx("size-1.5 md:size-2 rounded-full",
                                tx.status === 'COMPLETED' ? 'bg-emerald-600 dark:bg-emerald-400' :
                                tx.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                              )}></span> 
                              {tx.status === 'COMPLETED' ? 'Completado' : tx.status === 'PENDING' ? 'Procesando' : 'Cancelado'}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-3 md:py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
              <button className="text-[10px] md:text-sm font-bold text-primary dark:text-slate-300 flex items-center justify-center gap-2 w-full hover:gap-3 transition-all">
                Ver todos los movimientos <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Saldos por Fuente & Quick Actions */}
        <div className="space-y-6 md:space-y-8">
          {/* Saldos por Fuente */}
          <div className="glass-card p-5 md:p-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg mb-4 md:mb-6">Saldos por Fuente</h3>
            <div className="space-y-4 md:space-y-5">
              {accounts.length === 0 && !loading && (
                <p className="text-center text-sm text-slate-500">No hay cuentas activas</p>
              )}
              {accounts.map((acc, index) => {
                const theme = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
                const percentage = totalAccountsBalance > 0 ? (Number(acc.currentBalance) / totalAccountsBalance) * 100 : 0;
                
                return (
                  <div key={acc.id} className="space-y-1.5 md:space-y-2 group cursor-pointer">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold group-hover:text-primary transition-colors">{acc.name}</span>
                      <span className="text-slate-900 dark:text-white font-black">{formatCurrency(Number(acc.currentBalance))}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 md:h-1.5 rounded-full overflow-hidden">
                      <div className={clsx("h-full rounded-full transition-all duration-1000", theme.barClass)} style={{ width: `${Math.max(5, Math.min(percentage, 100))}%` }}></div>
                    </div>
                    <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest">{ACCOUNT_TYPES_ES[acc.type] || acc.type}</span>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-4 md:mt-6 py-2 md:py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Ver detalle completo
            </button>
          </div>

          {/* Alertas */}
          <div className="glass-card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4 text-amber-600">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-bold text-base md:text-lg">Alertas</h3>
            </div>
            <div className="space-y-3">
              {analytics.pendingCount > 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-lg">
                  <p className="text-[10px] md:text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-tight">Cuentas por Pagar</p>
                  <p className="text-xs md:text-sm text-amber-900 dark:text-amber-100">Tienes {analytics.pendingCount} obligaciones financieras pendientes este mes.</p>
                </div>
              ) : null}
              {analytics.expenseDiff > 20 ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-400 rounded-r-lg">
                  <p className="text-[10px] md:text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-tight">Gastos Elevados</p>
                  <p className="text-xs md:text-sm text-rose-900 dark:text-rose-100">Tus gastos han aumentado drásticamente (+{analytics.expenseDiff.toFixed(1)}%) comparado al mes anterior.</p>
                </div>
              ) : null}
              {analytics.pendingCount === 0 && analytics.expenseDiff <= 20 ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 rounded-r-lg">
                  <p className="text-[10px] md:text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-tight">Todo en Orden</p>
                  <p className="text-xs md:text-sm text-emerald-900 dark:text-emerald-100">Tus métricas están estables para este período.</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary rounded-xl md:rounded-2xl p-5 md:p-6 text-white shadow-xl shadow-primary/30">
            <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3">
              <button className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl transition-all border border-white/5 group">
                <span className="material-symbols-outlined text-emerald-400 mb-1 group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-[10px] md:text-xs font-bold">Ingreso</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl transition-all border border-white/5 group">
                <span className="material-symbols-outlined text-rose-400 mb-1 group-hover:scale-110 transition-transform">do_not_disturb_on</span>
                <span className="text-[10px] md:text-xs font-bold">Gasto</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl transition-all border border-white/5 group">
                <span className="material-symbols-outlined text-indigo-300 mb-1 group-hover:scale-110 transition-transform">share</span>
                <span className="text-[10px] md:text-xs font-bold">Reparto</span>
              </button>
              <button className="flex flex-col items-center justify-center p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl transition-all border border-white/5 group">
                <span className="material-symbols-outlined text-amber-300 mb-1 group-hover:scale-110 transition-transform">account_balance</span>
                <span className="text-[10px] md:text-xs font-bold">Préstamo</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
