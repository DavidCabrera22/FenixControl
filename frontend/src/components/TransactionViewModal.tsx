import { formatCurrency } from '../lib/utils';
import { clsx } from 'clsx';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  thirdPartyName?: string;
  date: string;
  createdAt: string;
  category?: { name: string };
  accountFrom?: { name: string };
  accountTo?: { name: string };
  attachmentUrl?: string;
}

interface TransactionViewModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionViewModal = ({ transaction, isOpen, onClose }: TransactionViewModalProps) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <span className="material-symbols-outlined">receipt_long</span>
            <h2 className="text-lg font-bold tracking-tight">Detalle del Movimiento</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
              {transaction.type === 'INCOME' ? 'Ingreso' : transaction.type === 'EXPENSE' ? 'Gasto' : transaction.type === 'ALLOCATION' ? 'Reparto' : 'Transferencia'}
            </p>
            <h3 className={clsx(
              "text-4xl font-black mb-1",
              transaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 
              transaction.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            )}>
              {transaction.type === 'EXPENSE' ? '-' : ''}{formatCurrency(Number(transaction.amount))}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {new Date(transaction.date || transaction.createdAt || new Date()).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cuenta</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {transaction.type === 'INCOME' ? (transaction.accountTo?.name || 'Varios') : (transaction.accountFrom?.name || 'Varios')}
                </p>
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Categoría</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {transaction.category?.name || 'General'}
                </p>
             </div>
             {transaction.thirdPartyName && (
               <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Tercero</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {transaction.thirdPartyName}
                  </p>
               </div>
             )}
             {transaction.description && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Descripción / Notas</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {transaction.description}
                  </p>
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-3">Soporte Adjunto</p>
            {transaction.attachmentUrl ? (
              <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-xl block">image</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                    {transaction.attachmentUrl.split('/').pop() || 'Archivo adjunto'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">download</span>
              </a>
            ) : (
               <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
                 No hay archivos adjuntos
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
