import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionViewModal } from '../components/TransactionViewModal';

interface Transaction {
  id: string;
  sourceId: string;
  categoryId: string;
  type: 'INCOME' | 'EXPENSE' | 'ALLOCATION' | 'TRANSFER';
  amount: number;
  description: string;
  thirdPartyName?: string;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  category?: { name: string };
  categoryRel?: { name: string, color: string };
  sourceRel?: { name: string };
  accountFrom?: { name: string };
  accountTo?: { name: string };
}

export const Transactions = () => {
  const { globalSearch = '' } = useOutletContext<{ globalSearch?: string }>() || {};
  const searchTerm = globalSearch;
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<Transaction | null>(null);
  const [selectedTxForView, setSelectedTxForView] = useState<Transaction | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('Todos los tipos');
  const [filterSource, setFilterSource] = useState('Todas las fuentes');
  const [filterAccount, setFilterAccount] = useState('Todas las cuentas');
  const [filterCategory, setFilterCategory] = useState('Todas las categorías');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = searchTerm === '' || 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.thirdPartyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.accountFrom?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.accountTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === 'Todos los tipos' ||
      (filterType === 'Ingreso' && tx.type === 'INCOME') ||
      (filterType === 'Gasto' && tx.type === 'EXPENSE') ||
      (filterType === 'Transferencia' && tx.type === 'TRANSFER');
      
    // (Sources are complex since it is an array. Skipping full source match for mockup simplicity, assuming true if 'Todas')
    const matchesSource = filterSource === 'Todas las fuentes';
    
    const accName = tx.type === 'INCOME' ? tx.accountTo?.name : tx.accountFrom?.name;
    const matchesAccount = filterAccount === 'Todas las cuentas' || accName === filterAccount;
    
    const matchesCategory = filterCategory === 'Todas las categorías' || tx.category?.name === filterCategory;

    return matchesSearch && matchesType && matchesSource && matchesAccount && matchesCategory;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setFilterType('Todos los tipos');
    setFilterSource('Todas las fuentes');
    setFilterAccount('Todas las cuentas');
    setFilterCategory('Todas las categorías');
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
      try {
        await axios.delete(`http://localhost:3000/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        console.error("Error al eliminar el movimiento", err);
        alert("Hubo un error al eliminar el movimiento.");
      }
    }
  };

  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category?.name).filter(Boolean)));
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.type === 'INCOME' ? t.accountTo?.name : t.accountFrom?.name).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Movimientos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Registro y control de ingresos, gastos, transferencias y pagos</p>
        </div>
        <button 
          onClick={() => { setSelectedTxForEdit(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 md:px-5 py-2.5 text-sm md:text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      {/* Quick Search & Filters */}
      <div className="glass-card p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3 md:gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 md:mb-2">Rango de fechas</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">calendar_today</span>
              <input className="w-full h-10 md:h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-10 pr-4 text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all" type="text" placeholder="Seleccionar fechas" />
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 md:mb-2">Tipo</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} className="w-full h-10 md:h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs md:text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
              <option>Todos los tipos</option>
              <option>Ingreso</option>
              <option>Gasto</option>
              <option>Transferencia</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 md:mb-2">Fuente</label>
            <select className="w-full h-10 md:h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs md:text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
              <option>Todas las fuentes</option>
              <option>Software</option>
              <option>Oficina</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 md:mb-2">Cuenta</label>
            <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }} className="w-full h-10 md:h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs md:text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
              <option>Todas las cuentas</option>
              {uniqueAccounts.map(acc => <option key={acc} value={acc}>{acc}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
             <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase mb-1.5 md:mb-2">Categoría</label>
             <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} className="w-full h-10 md:h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 text-xs md:text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer">
               <option>Todas las categorías</option>
               {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2 md:pt-6">
            <button className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-6 rounded-lg md:rounded-xl bg-primary text-white text-xs md:text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">Filtrar</button>
            <button onClick={handleClearFilters} className="flex-1 md:flex-none h-10 md:h-11 px-4 md:px-6 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs md:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Limpiar</button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-slate-500">Cargando movimientos...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80">
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedTransactions.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No se encontraron movimientos.</td></tr>
                ) : (
                  paginatedTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col">
                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white capitalize">
                          {new Date(tx.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-500">{new Date(tx.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className={clsx(
                          "px-2 md:px-2.5 py-1 text-[9px] md:text-[10px] font-black rounded uppercase",
                          tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                          tx.type === 'ALLOCATION' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                          'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : tx.type === 'ALLOCATION' ? 'Reparto' : 'Transferencia'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="font-semibold text-xs md:text-sm text-slate-700 dark:text-slate-300">
                          {tx.type === 'INCOME' ? (tx.accountTo?.name || 'Varios') : (tx.accountFrom?.name || 'Varios')}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">{tx.category?.name || 'General'}</span>
                      </td>
                      <td className={clsx("px-4 md:px-6 py-3 md:py-4 text-right font-bold text-xs md:text-sm whitespace-nowrap",
                        tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 
                        tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      )}>
                        {tx.type === 'EXPENSE' ? '-' : ''}{formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 md:px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                          {tx.status === 'COMPLETED' ? 'Completado' : tx.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                        <div className="flex justify-center gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedTxForView(tx); setIsViewModalOpen(true); }} className="p-1 md:p-1.5 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Ver detalle">
                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">visibility</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedTxForEdit(tx); setIsModalOpen(true); }} className="p-1 md:p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }} className="p-1 md:p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Eliminar">
                            <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-4 md:px-6 py-3 md:py-4 bg-slate-50/30 dark:bg-slate-800/10">
          <p className="text-[10px] md:text-sm text-slate-500">
            Mostrando <span className="font-bold">{filteredTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> de <span className="font-bold">{filteredTransactions.length}</span> resultados
          </p>
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center size-7 md:size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 transition-colors">
              <span className="material-symbols-outlined text-sm md:text-lg">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={clsx(
                  "flex items-center justify-center size-7 md:size-8 rounded-lg border text-[10px] md:text-sm font-bold transition-colors",
                  currentPage === i + 1 
                    ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}>
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center size-7 md:size-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] md:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-sm md:text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchTransactions} initialData={selectedTxForEdit} />
      <TransactionViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} transaction={selectedTxForView} />
    </div>
  );
};
