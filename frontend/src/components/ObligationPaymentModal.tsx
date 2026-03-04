import { useState } from 'react';
import axios from 'axios';
import { formatCurrency } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';

interface ObligationPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  obligation: Record<string, unknown> | null;
  accounts: { id: string; name: string }[];
}

export const ObligationPaymentModal = ({ isOpen, onClose, onPaymentSuccess, obligation, accounts }: ObligationPaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !obligation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) {
      alert("Por favor ingresa el monto y selecciona una cuenta de origen.");
      return;
    }

    const ob = obligation as any;
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
       alert("El monto debe ser numérico y mayor a 0.");
       return;
    }
    
    if (paymentAmount > Number(ob.remainingAmount)) {
       alert("El monto a pagar no puede ser mayor al saldo pendiente de la obligación.");
       return;
    }

    setIsSubmitting(true);
    try {
      // Create a transaction representing the payment
      const transactionPayload = {
        date: new Date().toISOString(),
        type: ob.type === 'DEBT' ? 'EXPENSE' : 'INCOME', // If it's a debt we pay (Expense). If they owe us, they pay (Income). Adjust based on exact business logic
        amount: paymentAmount,
        accountId: accountId,
        description: `Abono a obligación: ${ob.name}`,
        thirdPartyName: ob.partner?.name,
      };

      await axios.post('http://localhost:3000/transactions', transactionPayload);

      // Update the obligation remaining balance
      const newRemaining = Number(ob.remainingAmount) - paymentAmount;
      const status = newRemaining <= 0 ? 'PAID' : ob.status;

      await axios.patch(`http://localhost:3000/obligations/${ob.id}`, {
        remainingAmount: newRemaining,
        status: status
      });

      onPaymentSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500">
            <span className="material-symbols-outlined">payments</span>
            <h2 className="text-lg font-bold tracking-tight">Pagar Obligación</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{String(obligation.name)}</p>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
               {formatCurrency(Number(obligation.remainingAmount))}
             </h3>
             <p className="text-[10px] text-slate-400 font-medium uppercase">Saldo Pendiente Actual</p>
          </div>

          <div className="space-y-4 pt-2">
             <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Monto a Pagar</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 font-black text-slate-900 dark:text-slate-100 placeholder:font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"/>
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta de Origen / Pago</label>
                <SearchableSelect options={accountOptions} value={accountId} onChange={setAccountId} placeholder="Buscar cuenta..." />
             </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {isSubmitting ? 'Procesando...' : 'Confirmar Pago'}
            </button>
            <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
