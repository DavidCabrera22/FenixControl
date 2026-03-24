import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchableSelect } from './SearchableSelect';
import { formatCurrency } from '../lib/utils';
import { CurrencyInput } from './CurrencyInput';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
}

interface Account {
  id: string;
  name: string;
  currentBalance: number;
}

export const AllocationModal = ({ isOpen, onClose, onSaved, initialData }: AllocationModalProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      axios.get("/accounts").then(res => setAccounts(res.data)).catch(console.error);
    }
    
    if (initialData && isOpen) {
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAccountId(initialData.accountId || initialData.account?.id || '');
      setTotalAmount(initialData.totalAmount ? String(initialData.totalAmount) : '');
      setStatus(initialData.status || 'OPEN');
      setNotes(initialData.notes || '');
    } else if (!initialData && isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setAccountId('');
      setTotalAmount('');
      setStatus('OPEN');
      setNotes('');
    }
    if (!isOpen) setRemainingBalance(null);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      alert("Por favor ingresa un monto válido.");
      return;
    }
    if (!accountId) {
      alert("Debes seleccionar una Cuenta Origen.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        date,
        accountId,
        totalAmount: Number(totalAmount),
        status,
        notes: notes || undefined,
      };

      if (initialData?.id) {
        await axios.patch(`/allocations/${initialData.id}`, payload);
        onSaved();
        onClose();
      } else {
        await axios.post('/allocations', payload);
        const selectedAccount = accounts.find(a => a.id === accountId);
        const newBalance = selectedAccount
          ? Number(selectedAccount.currentBalance) - Number(totalAmount)
          : null;
        setRemainingBalance(newBalance);
        onSaved();
        setTimeout(() => {
          setRemainingBalance(null);
          onClose();
        }, 4000);
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al guardar el reparto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <span className="material-symbols-outlined">{initialData ? 'edit' : 'add_circle'}</span>
            <h2 className="text-lg font-bold tracking-tight">{initialData ? 'Editar Reparto' : 'Nuevo Reparto'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Fecha & Estado */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fecha</label>
              <div className="relative">
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Estado</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
                <option value="OPEN">Borrador</option>
                <option value="CLOSED">Confirmado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            {/* Monto */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Total a distribuir</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <CurrencyInput required value={totalAmount} onChange={setTotalAmount} placeholder="0" className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 text-lg font-black text-slate-900 dark:text-slate-100 placeholder:font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>

            {/* Cuenta */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta Origen</label>
              <SearchableSelect options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Buscar cuenta..." />
            </div>

            {/* Saldo disponible */}
            {accountId && (() => {
              const selected = accounts.find(a => a.id === accountId);
              if (!selected) return null;
              const available = Number(selected.currentBalance);
              const amount = Number(totalAmount) || 0;
              const isInsufficient = amount > 0 && amount > available;
              return (
                <div className={`md:col-span-2 rounded-xl px-4 py-3 flex items-center justify-between border ${isInsufficient ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${isInsufficient ? 'text-rose-500' : 'text-slate-400'}`}>account_balance_wallet</span>
                    <span className={`text-xs font-bold uppercase tracking-wide ${isInsufficient ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      Disponible en cuenta
                    </span>
                  </div>
                  <span className={`text-sm font-black ${isInsufficient ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(available)}
                  </span>
                </div>
              );
            })()}

            {/* Notas */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Notas / Descripción</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Agrega notas opcionales (ej: Reparto mensual de servicios)" className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"></textarea>
            </div>

          </div>

          {remainingBalance !== null && (
            <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span className="text-xs font-bold uppercase tracking-wide">Reparto guardado — Saldo restante</span>
              </div>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || remainingBalance !== null} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none">
              {isSubmitting ? 'Guardando...' : 'Guardar Reparto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
