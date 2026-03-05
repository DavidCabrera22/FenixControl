import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';
import { TransactionViewModal } from '../components/TransactionViewModal';

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description?: string;
  thirdPartyName?: string;
  accountFrom?: { name: string };
  accountTo?: { name: string };
  category?: { name: string };
  status: string;
  createdAt: string;
  attachmentUrl?: string;
}

export const ObligationMovements = () => {
  const navigate = useNavigate();
  const [movements, setMovements] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/transactions");
      // Filtramos solo los abonos a obligaciones
      const filtered = res.data.filter((t: Transaction) => t.description?.includes('Abono a obligación'));
      // Orden descendente por fecha
      filtered.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMovements(filtered);
    } catch (err) {
      console.error("Error fetching obligation movements", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsViewModalOpen(true);
  };

  // Filtrado y búsqueda
  const filteredMovements = movements.filter((tx) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(searchLower);
      const matchThirdParty = tx.thirdPartyName?.toLowerCase().includes(searchLower);
      const matchAccount = (tx.accountFrom?.name || tx.accountTo?.name || '').toLowerCase().includes(searchLower);
      if (!matchDesc && !matchThirdParty && !matchAccount) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={() => navigate('/obligations')} 
              className="text-slate-400 hover:text-primary transition-colors flex items-center justify-center p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-primary dark:text-slate-100 tracking-tight">Movimientos de Obligaciones</h2>
          </div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 ml-9">Historial detallado de los abonos y pagos realizados</p>
        </div>
      </div>

      {/* Bar: Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Buscar por tercero, cuenta o descripción..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300 transition-all outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest w-32">Fecha</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-xs font-black text-primary dark:text-slate-400 uppercase tracking-widest text-right w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                     <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary opacity-50">progress_activity</span>
                     <p className="font-medium text-sm">Cargando movimientos...</p>
                   </td>
                </tr>
              ) : paginatedMovements.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-20 text-center text-slate-500">
                     <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                     <p className="font-medium text-sm">No se encontraron movimientos</p>
                   </td>
                </tr>
              ) : (
                paginatedMovements.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                         {new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                         {new Date(tx.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{tx.description}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{tx.accountTo?.name || tx.accountFrom?.name || 'Movimiento'} • {tx.thirdPartyName || 'Sin Tercero'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={clsx("text-sm font-black text-slate-900 dark:text-slate-100")}>
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleViewDetails(tx)} className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 hover:text-primary transition-colors inline-flex items-center justify-center opacity-0 group-hover:opacity-100" title="Ver Detalles">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && filteredMovements.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/50 mt-auto">
            <span className="text-sm font-medium text-slate-500">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMovements.length)} a {Math.min(currentPage * itemsPerPage, filteredMovements.length)} de <strong className="text-slate-900 dark:text-white font-bold">{filteredMovements.length}</strong>
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

       <TransactionViewModal 
        transaction={selectedTx}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
};
