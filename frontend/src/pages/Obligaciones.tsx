import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';
import { ObligationModal } from '../components/ObligationModal';
import { ObligationPaymentModal } from '../components/ObligationPaymentModal';

interface Obligation {
  id: string;
  name: string;
  type: string;
  partnerId: string;
  partner: { id: string; name: string };
  initialAmount: string | number;
  remainingAmount: string | number;
  interestRate: string | number;
  dueDate: string;
  status: string;
}

interface Account {
  id: string;
  name: string;
}

export const Obligaciones = () => {
  const { globalSearchTerm } = useOutletContext<{ globalSearchTerm: string }>();
  const navigate = useNavigate();

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedObligation, setSelectedObligation] = useState<Obligation | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [obsRes, accsRes] = await Promise.all([
        axios.get(" /obligations " ),
        axios.get(" /accounts " )
      ]);
      setObligations(obsRes.data);
      setAccounts(accsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("¿Estás seguro de que quieres eliminar esta obligación? Esta acción no se puede deshacer.")) {
      try {
        await axios.delete(`/obligations/${id}`);
        fetchData();
      } catch (err) {
        console.error("Error deleting obligation:", err);
        alert("Error al eliminar la obligación.");
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, obligation: Obligation) => {
    e.stopPropagation();
    setSelectedObligation(obligation);
    setIsModalOpen(true);
  };

  const handlePay = (e: React.MouseEvent, obligation: Obligation) => {
    e.stopPropagation();
    setSelectedObligation(obligation);
    setIsPaymentModalOpen(true);
  };

  // KPI Calculations
  const totalDeudas = obligations.reduce((acc, curr) => acc + Number(curr.remainingAmount), 0);
  const vencidas = obligations.filter(o => o.status === 'OVERDUE' || (o.status === 'ACTIVE' && new Date(o.dueDate) < new Date())).reduce((acc, curr) => acc + Number(curr.remainingAmount), 0);
  const pagadas = obligations.filter(o => o.status === 'PAID').reduce((acc, curr) => acc + Number(curr.initialAmount), 0); // Simulated paid metrics for completeness

  // Filtering
  const filteredObligations = obligations.filter((obligation) => {
    // 1. Global Search
    if (globalSearchTerm) {
      const searchLower = globalSearchTerm.toLowerCase();
      const matchName = obligation.name.toLowerCase().includes(searchLower);
      const matchPartner = obligation.partner?.name.toLowerCase().includes(searchLower);
      if (!matchName && !matchPartner) return false;
    }

    // 2. Type Filter
    if (typeFilter !== 'Todos') {
       const mappedType = typeFilter === 'Préstamos' ? 'DEBT' : typeFilter === 'Compras' ? 'PURCHASE' : typeFilter === 'Gastos' ? 'EXPENSE' : '';
       if (mappedType && obligation.type !== mappedType) return false;
    }

    // 3. Status Filter
    if (statusFilter !== 'Todos') {
       const mappedStatus = statusFilter === 'Pendiente' ? 'ACTIVE' : statusFilter === 'Vencido' ? 'OVERDUE' : statusFilter === 'Pagado' ? 'PAID' : '';
       if (mappedStatus && obligation.status !== mappedStatus) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredObligations.length / itemsPerPage);
  const paginatedObligations = filteredObligations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-primary dark:text-slate-100 tracking-tight">Obligaciones</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Control de préstamos, deudas y cuentas pendientes</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/obligations/movements')}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">history</span>
            Ver Movimientos
          </button>
          <button 
            onClick={() => { setSelectedObligation(null); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Nueva Obligación
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-primary">account_balance_wallet</span>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Total Deudas</p>
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 relative z-10">
            {formatCurrency(totalDeudas)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-red-500">warning</span>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Vencidas</p>
            <div className="size-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-red-600 dark:text-red-400 relative z-10">
            {formatCurrency(vencidas)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <span className="material-symbols-outlined text-8xl text-emerald-500">payments</span>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Pagos Historicos</p>
            <div className="size-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 relative z-10">
            {formatCurrency(pagadas)}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">Filtros</span>
        </div>
        
        <div className="relative">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold py-2.5 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 transition-shadow cursor-pointer">
            <option>Todos</option>
            <option>Préstamos</option>
            <option>Compras</option>
            <option>Gastos</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">expand_more</span>
        </div>

        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold py-2.5 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 transition-shadow cursor-pointer">
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Vencido</option>
            <option>Pagado</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">expand_more</span>
        </div>
        
        <div className="ml-auto">
          <button onClick={() => { setTypeFilter('Todos'); setStatusFilter('Todos'); }} className="text-slate-500 hover:text-primary dark:hover:text-primary-light text-sm font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-xl">filter_alt_off</span>
            Limpiar
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest w-[30%]">Nombre</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest text-right">Monto Inicial</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest text-right">Saldo Pendiente</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest">Vencimiento</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                     <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary opacity-50">progress_activity</span>
                     <p className="font-medium text-sm">Cargando obligaciones...</p>
                   </td>
                </tr>
              ) : paginatedObligations.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                     <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                     <p className="font-medium text-sm">No se encontraron obligaciones</p>
                   </td>
                </tr>
              ) : (
                paginatedObligations.map(ob => {
                  const typeLabel = ob.type === 'DEBT' ? 'Préstamo' : ob.type === 'PURCHASE' ? 'Compra' : 'Gastos';
                  const isOverdue = ob.status === 'OVERDUE' || (ob.status === 'ACTIVE' && new Date(ob.dueDate) < new Date());
                  const statusMap: Record<string, { label: string; classes: string }> = {
                    'ACTIVE': { label: 'Pendiente', classes: isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
                    'PAID': { label: 'Pagado', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
                    'OVERDUE': { label: 'Vencido', classes: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' }
                  };
                  
                  const activeStatus = isOverdue && ob.status !== 'PAID' ? statusMap['OVERDUE'] : statusMap[ob.status] || statusMap['ACTIVE'];
                  
                  return (
                    <tr key={ob.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ob.name}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{ob.partner?.name || 'Sin Tercero'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{typeLabel}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{formatCurrency(Number(ob.initialAmount))}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={clsx("text-sm font-black", Number(ob.remainingAmount) === 0 ? "text-slate-400" : isOverdue ? "text-red-600 dark:text-red-400" : "text-primary dark:text-slate-100")}>
                          {formatCurrency(Number(ob.remainingAmount))}
                        </span>
                      </td>
                       <td className="px-6 py-4">
                         <span className={clsx("text-sm font-bold uppercase", isOverdue && ob.status !== 'PAID' ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400")}>
                            {new Date(ob.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest", activeStatus.classes)}>
                          {activeStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Number(ob.remainingAmount) > 0 && (
                            <button onClick={(e) => handlePay(e, ob)} className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center mr-2" title="Pagar">
                              <span className="material-symbols-outlined text-[18px]">payments</span>
                            </button>
                          )}
                          <button onClick={(e) => handleEdit(e, ob)} className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors flex items-center justify-center" title="Editar">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button onClick={(e) => handleDelete(e, ob.id)} className="size-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center" title="Eliminar">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && filteredObligations.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/50">
            <span className="text-sm font-medium text-slate-500">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredObligations.length)} a {Math.min(currentPage * itemsPerPage, filteredObligations.length)} de <strong className="text-slate-900 dark:text-white font-bold">{filteredObligations.length}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
               >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={clsx(
                    "size-8 flex items-center justify-center rounded-lg text-sm font-black transition-all",
                    currentPage === i + 1 
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  )}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ObligationModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedObligation(null); }}
        onSaved={fetchData}
        initialData={selectedObligation as any}
      />

       <ObligationPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedObligation(null); }}
        onPaymentSuccess={fetchData}
        obligation={selectedObligation as any}
        accounts={accounts}
      />
    </div>
  );
};
