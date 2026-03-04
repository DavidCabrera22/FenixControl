import { formatCurrency } from '../lib/utils';

interface Allocation {
  id: string;
  date: string;
  totalAmount: number;
  status: string;
  notes?: string;
  account: { name: string };
  allocationLines: unknown[];
}

interface AllocationViewModalProps {
  allocation: Allocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AllocationViewModal = ({ allocation, isOpen, onClose }: AllocationViewModalProps) => {
  if (!isOpen || !allocation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <span className="material-symbols-outlined">receipt_long</span>
            <h2 className="text-lg font-bold tracking-tight">Detalle del Reparto</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
              {allocation.status === 'CLOSED' ? 'Confirmado' : allocation.status === 'OPEN' ? 'Borrador' : 'Cancelado'}
            </p>
            <h3 className="text-4xl font-black mb-1 text-slate-900 dark:text-white">
              {formatCurrency(Number(allocation.totalAmount))}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {new Date(allocation.date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cuenta de Origen</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {allocation.account?.name || 'No asignada'}
                </p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Líneas distribuidas</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {allocation.allocationLines?.length || 0} líneas
                </p>
             </div>
             {allocation.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Descripción / Notas</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {allocation.notes}
                  </p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
