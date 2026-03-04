import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Transaction {
  id: string;
  type: string;
  amount: string | number;
  description?: string;
  date: string;
}

interface Account {
  id: string;
  name: string;
  currentBalance: string | number;
  type?: string;
  transactionsFrom?: Transaction[];
  transactionsTo?: Transaction[];
}

interface Source {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
}

interface Obligation {
  id: string;
  remainingAmount: string | number;
}

// Extends Transaction to include common relations from backend
interface PopulatedTransaction extends Transaction {
  transactionSources?: { sourceId: string, amount: string | number }[];
  accountId?: string;
  partnerId?: string;
  fromAccountId?: string;
  toAccountId?: string;
}

export const Reports = () => {
  const { globalSearch } = useOutletContext<{ globalSearch: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Filter States
  const [dateRange, setDateRange] = useState('ALL'); // ALL, THIS_YEAR, THIS_MONTH
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  
  const reportRef = useRef<HTMLDivElement>(null);

  // KPIs
  const [kpis, setKpis] = useState({
    ingresos: 0,
    gastos: 0,
    neto: 0,
    transferencias: 0,
    saldoFinal: 0,
    deudaPendiente: 0,
  });

  const [monthlyData, setMonthlyData] = useState<{ name: string; Ingresos: number; Gastos: number }[]>([]);
  const [topIngresos, setTopIngresos] = useState<Transaction[]>([]);
  const [topGastos, setTopGastos] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txRes, accRes, obRes, sourceRes, partnerRes] = await Promise.all([
        axios.get(" /transactions " ),
        axios.get(" /accounts " ),
        axios.get(" /obligations " ),
        axios.get(" /sources " ),
        axios.get(" /partners " )
      ]);

      const txs: Transaction[] = txRes.data;
      const accs: Account[] = accRes.data;
      const obs: Obligation[] = obRes.data;

      setAllTransactions(txs);
      setAccounts(accs);
      setSources(sourceRes.data);
      setPartners(partnerRes.data);

      applyFiltersAndCalculate(txs, accs, obs, dateRange, selectedSource, selectedAccount, selectedPartner, globalSearch);
    } catch (err) {
      console.error("Error fetching reports data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-apply filters when state changes
  useEffect(() => {
    if (!isLoading && allTransactions.length > 0) {
      applyFiltersAndCalculate(allTransactions, accounts, obligations, dateRange, selectedSource, selectedAccount, selectedPartner, globalSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedSource, selectedAccount, selectedPartner, globalSearch]);

  const applyFiltersAndCalculate = (
    txs: Transaction[], 
    accs: Account[], 
    obs: Obligation[],
    dateFilter: string,
    sourceFilter: string,
    accountFilter: string,
    partnerFilter: string,
    searchFilter: string
  ) => {
    // 1. Filter Transactions
    let filteredTxs = txs as PopulatedTransaction[];

    // Date Filter
    if (dateFilter === 'THIS_YEAR') {
      const year = new Date().getFullYear();
      filteredTxs = filteredTxs.filter(t => new Date(t.date).getFullYear() === year);
    } else if (dateFilter === 'THIS_MONTH') {
      const now = new Date();
      filteredTxs = filteredTxs.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    // Fuente, Cuenta, Socio
    if (sourceFilter !== 'ALL') {
       filteredTxs = filteredTxs.filter(t => t.transactionSources?.some(ts => ts.sourceId === sourceFilter));
    }
    
    if (accountFilter !== 'ALL') {
       filteredTxs = filteredTxs.filter(t => t.accountId === accountFilter || t.fromAccountId === accountFilter || t.toAccountId === accountFilter);
    }
    
    if (partnerFilter !== 'ALL') {
       filteredTxs = filteredTxs.filter(t => t.partnerId === partnerFilter);
    }
    
    // Global Search
    if (searchFilter && searchFilter.trim() !== '') {
      const lowerSearch = searchFilter.toLowerCase();
      filteredTxs = filteredTxs.filter(t => 
        t.description?.toLowerCase().includes(lowerSearch) || 
        String(t.amount).includes(lowerSearch)
      );
    }

    // 2. Calculate Metrics from Filtered Txs
    let ingresos = 0;
    let gastos = 0;
    let transferencias = 0;

    const incomes: Transaction[] = [];
    const expenses: Transaction[] = [];

    filteredTxs.forEach(t => {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        ingresos += amount;
        incomes.push(t);
      } else if (t.type === 'EXPENSE') {
        gastos += amount;
        expenses.push(t);
      } else if (t.type === 'TRANSFER' || t.type === 'ALLOCATION') {
        transferencias += amount;
      }
    });

    const saldoFinal = accs.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
    const deudaPendiente = obs.reduce((acc, curr) => acc + Number(curr.remainingAmount), 0);

    setKpis({
      ingresos,
      gastos,
      neto: ingresos - gastos,
      transferencias,
      saldoFinal,
      deudaPendiente
    });

    // Top 5
    incomes.sort((a, b) => Number(b.amount) - Number(a.amount));
    expenses.sort((a, b) => Number(b.amount) - Number(a.amount));
    setTopIngresos(incomes.slice(0, 5));
    setTopGastos(expenses.slice(0, 5));

    // Chart Data (Group by month)
    const monthsObj: Record<string, { Ingresos: number; Gastos: number }> = {};
    
    // Configurar meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      monthsObj[monthName] = { Ingresos: 0, Gastos: 0 };
    }

    filteredTxs.forEach(t => {
      const d = new Date(t.date);
      const monthName = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      const amount = Number(t.amount);
      
      if (monthsObj[monthName]) {
        if (t.type === 'INCOME') monthsObj[monthName].Ingresos += amount;
        if (t.type === 'EXPENSE') monthsObj[monthName].Gastos += amount;
      }
    });

    setMonthlyData(Object.keys(monthsObj).map(key => ({
      name: key,
      Ingresos: monthsObj[key].Ingresos,
      Gastos: monthsObj[key].Gastos
    })));
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      // Ocultar botones no deseados en el PDF si es necesario añadiendo una clase
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_FenixControl_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
      alert("Hubo un error generando el PDF.");
    }
  };

  if (isLoading) {
     return (
        <div className="p-8 flex items-center justify-center min-h-[500px]">
           <div className="flex flex-col items-center">
             <span className="material-symbols-outlined max-h-min animate-spin text-primary text-5xl mb-4">progress_activity</span>
             <p className="font-bold text-slate-500">Cargando reportes en vivo...</p>
           </div>
        </div>
     );
  }

  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto" ref={reportRef}>
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reportes</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Balance general y análisis por fechas</p>
        </div>
        <div className="flex gap-3 data-html2canvas-ignore">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar
            <span className="material-symbols-outlined text-lg">expand_more</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Guardar reporte
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Rango de fechas</span>
          <select 
             value={dateRange}
             onChange={(e) => setDateRange(e.target.value)}
             className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 transition-all text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Todo el Historial</option>
            <option value="THIS_YEAR">Este Año</option>
            <option value="THIS_MONTH">Este Mes</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Fuente</span>
          <select 
             value={selectedSource}
             onChange={(e) => setSelectedSource(e.target.value)}
             className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 transition-all text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Todas</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Cuenta</span>
          <select 
             value={selectedAccount}
             onChange={(e) => setSelectedAccount(e.target.value)}
             className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 transition-all text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Todas</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
           <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Socio</span>
           <select 
             value={selectedPartner}
             onChange={(e) => setSelectedPartner(e.target.value)}
             className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 transition-all text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="ALL">Todos</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        <div className="ml-auto flex gap-2 self-end data-html2canvas-ignore">
          <button 
             onClick={() => {
                setDateRange('ALL');
                setSelectedSource('ALL');
                setSelectedAccount('ALL');
                setSelectedPartner('ALL');
             }} 
             className="px-4 py-2 text-sm font-bold text-primary dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
             Limpiar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Ingresos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg">arrow_downward</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Ingresos</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.ingresos)}>{formatCurrency(kpis.ingresos)}</p>
        </div>
        {/* Gastos */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg">arrow_upward</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Gastos</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.gastos)}>{formatCurrency(kpis.gastos)}</p>
        </div>
        {/* Neto */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-primary">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">balance</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Neto</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.neto)}>{formatCurrency(kpis.neto)}</p>
        </div>
        {/* Transferencias */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-blue-500 bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">swap_horiz</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Repartos / Transf.</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.transferencias)}>{formatCurrency(kpis.transferencias)}</p>
        </div>
        {/* Saldo Final */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg">account_balance</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Saldo Final</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.saldoFinal)}>{formatCurrency(kpis.saldoFinal)}</p>
        </div>
        {/* Deuda Pendiente */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="material-symbols-outlined text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">pending_actions</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Deuda Pendiente</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={formatCurrency(kpis.deudaPendiente)}>{formatCurrency(kpis.deudaPendiente)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex gap-8 overflow-x-auto scrollbar-hide">
        <button className="pb-4 px-1 text-sm font-bold border-b-2 border-primary text-primary dark:text-white whitespace-nowrap">General</button>
        <button className="pb-4 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 whitespace-nowrap">Por Fuente</button>
        <button className="pb-4 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 whitespace-nowrap">Por Cuentas</button>
        <button className="pb-4 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 whitespace-nowrap">Por Socio</button>
        <button className="pb-4 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 whitespace-nowrap">Por Categoría</button>
        <button className="pb-4 px-1 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 whitespace-nowrap">Obligaciones</button>
      </div>

      {/* Tab Content: General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Middle Column (Chart and Tables) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Flujo del período</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `$${value >= 1000000 ? (value/1000000).toFixed(1)+'M' : (value/1000).toFixed(0)+'k'}`} 
                  />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                     formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                  <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Gastos" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Ingresos */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Top 5 Ingresos</h4>
              <div className="space-y-3">
                {topIngresos.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay datos suficientes</p>
                ) : (
                  topIngresos.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={tx.description}>{tx.description || 'Ingreso sin nombre'}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(Number(tx.amount))}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top 5 Gastos */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Top 5 Gastos</h4>
              <div className="space-y-3">
                {topGastos.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay datos suficientes</p>
                ) : (
                  topGastos.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={tx.description}>{tx.description || 'Gasto sin nombre'}</span>
                      <span className="font-bold text-rose-600">{formatCurrency(Number(tx.amount))}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side Table: Saldos Actuales */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Saldos Actuales</h3>
            <div className="space-y-5 flex-1 w-full max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <span className="material-symbols-outlined">{acc.type === 'CASH' ? 'payments' : acc.type === 'BANK' ? 'account_balance' : 'account_balance_wallet'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={acc.name}>{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white shrink-0">{formatCurrency(Number(acc.currentBalance))}</p>
                </div>
              ))}
              {accounts.length === 0 && <p className="text-sm text-slate-500">No hay cuentas registradas</p>}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-lg">
                <p className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-widest mb-2">Resumen Total</p>
                <div className="flex justify-between items-baseline">
                  <p className="text-3xl font-black text-primary dark:text-white" title={formatCurrency(kpis.saldoFinal)}>{formatCurrency(kpis.saldoFinal)}</p>
                </div>
              </div>
              <button className="w-full mt-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Ver todas las cuentas
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
