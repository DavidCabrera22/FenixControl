import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';
import { AllocationModal } from '../components/AllocationModal';
import { AllocationViewModal } from '../components/AllocationViewModal';

interface Allocation {
  id: string;
  date: string;
  totalAmount: number;
  status: string;
  notes?: string;
  account: { name: string };
  allocationLines: unknown[];
}

export const Allocations = () => {
  const { globalSearch } = useOutletContext<{ globalSearch: string }>();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAllocationForEdit, setSelectedAllocationForEdit] = useState<Allocation | null>(null);
  const [selectedAllocationForView, setSelectedAllocationForView] = useState<Allocation | null>(null);

  // Filters
  const [filterAccount, setFilterAccount] = useState('Todas las cuentas');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/allocations");
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este reparto?")) {
      try {
        await axios.delete(`/allocations/${id}`);
        fetchAllocations();
      } catch (err) {
        console.error("Error al eliminar el reparto", err);
        alert("Hubo un error al eliminar el reparto.");
      }
    }
  };

  const handleResetFilters = () => {
    setFilterAccount('Todas las cuentas');
    setFilterStatus('Todos');
    setCurrentPage(1);
  };

  const uniqueAccounts = Array.from(new Set(allocations.map(a => a.account?.name).filter(Boolean)));

  const filteredAllocations = allocations.filter(a => {
    // 1. Filter by Account
    if (filterAccount !== 'Todas las cuentas' && a.account?.name !== filterAccount) return false;

    // 2. Filter by Status
    // DB values typically OPEN, CLOSED, CANCELLED
    if (filterStatus === 'Borrador' && a.status !== 'OPEN') return false;
    if (filterStatus === 'Confirmado' && a.status !== 'CLOSED') return false;
    if (filterStatus === 'Cancelado' && a.status !== 'CANCELLED') return false;

    // 3. Global Search (Date, Amount, Account Name, Status)
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchAccount = a.account?.name?.toLowerCase().includes(searchLower);
      const matchAmount = String(a.totalAmount).includes(searchLower);
      const strStatus = a.status === 'OPEN' ? 'borrador' : a.status === 'CLOSED' ? 'confirmado' : 'cancelado';
      const matchStatus = strStatus.includes(searchLower);

      if (!matchAccount && !matchAmount && !matchStatus) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);
  const paginatedAllocations = filteredAllocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    if (status === 'CLOSED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    if (status === 'OPEN') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  };
  const getStatusDotColor = (status: string) => {
    if (status === 'CLOSED') return 'bg-green-500';
    if (status === 'OPEN') return 'bg-amber-500';
    return 'bg-slate-500';
  };
  const getStatusLabel = (status: string) => {
    if (status === 'CLOSED') return 'Confirmado';
    if (status === 'OPEN') return 'Borrador';
    if (status === 'CANCELLED') return 'Cancelado';
    return status;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Repartos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">Cuadros de distribución y ejecución de pagos centralizados.</p>
        </div>
        <button 
          onClick={() => { setSelectedAllocationForEdit(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          <span>Crear Reparto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-4 relative z-10">
        
        <div className="flex flex-col gap-1 w-full sm:flex-1 min-w-[160px]">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Cuenta</label>
          <select 
            value={filterAccount}
            onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }}
            className="form-select w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary/20 focus:border-primary py-2 cursor-pointer dark:text-white"
          >
            <option>Todas las cuentas</option>
            {uniqueAccounts.map(account => (
              <option key={account} value={account}>{account}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Estado</label>
          <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="form-select w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-primary/20 focus:border-primary py-2 cursor-pointer dark:text-white"
          >
            <option>Todos</option>
            <option>Borrador</option>
            <option>Confirmado</option>
            <option>Cancelado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 pt-4 w-full sm:w-auto">
          <button onClick={handleResetFilters} className="text-primary dark:text-primary font-semibold text-sm hover:underline px-2 w-full sm:w-auto text-left sm:text-center mt-2 sm:mt-0">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cuenta</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total distribuido</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Líneas</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Cargando repartos...
                    </div>
                  </td>
                </tr>
              ) : paginatedAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-slate-400">search_off</span>
                      </div>
                      <p className="text-sm font-medium">No se encontraron repartos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAllocations.map((allocation) => (
                  <tr key={allocation.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer" onClick={() => { setSelectedAllocationForView(allocation); setIsViewModalOpen(true); }}>
                    <td className="px-6 py-4 text-sm font-medium dark:text-slate-300">
                      {new Date(allocation.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium dark:text-slate-300">{allocation.account?.name || 'Varios'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(allocation.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {allocation.allocationLines?.length || 0} líneas
                    </td>
                    <td className="px-6 py-4">
                       <span className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border", getStatusColor(allocation.status))}>
                          <span className={clsx("size-1.5 rounded-full", getStatusDotColor(allocation.status))}></span>
                          {getStatusLabel(allocation.status)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedAllocationForView(allocation); setIsViewModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Ver detalle">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedAllocationForEdit(allocation); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Editar">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(allocation.id); }} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Eliminar">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination control */}
        {filteredAllocations.length > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs text-slate-500 font-medium">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAllocations.length)}-
              {Math.min(currentPage * itemsPerPage, filteredAllocations.length)} de {filteredAllocations.length} repartos registrados
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={clsx(
                    "px-3 py-1 rounded text-xs transition-all",
                    currentPage === idx + 1 
                      ? "bg-primary text-white font-bold shadow-sm"
                      : "border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 font-bold dark:text-slate-300"
                  )}
                >
                  {idx + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 transition-all dark:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AllocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaved={fetchAllocations} initialData={selectedAllocationForEdit} />
      <AllocationViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} allocation={selectedAllocationForView} />
    </div>
  );
};
