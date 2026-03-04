import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchableSelect } from './SearchableSelect';

interface ObligationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Record<string, unknown>;
}

interface Partner {
  id: string;
  name: string;
}

export const ObligationModal = ({ isOpen, onClose, onSaved, initialData }: ObligationModalProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState('DEBT');
  const [partnerId, setPartnerId] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:3000/partners').then(res => setPartners(res.data)).catch(console.error);
    }
    
    if (initialData && isOpen) {
      const data = initialData as any;
      setName(data.name || '');
      setType(data.type || 'DEBT');
      setPartnerId(data.partnerId || data.partner?.id || '');
      setInitialAmount(data.initialAmount ? String(data.initialAmount) : '');
      setRemainingAmount(data.remainingAmount ? String(data.remainingAmount) : '');
      setInterestRate(data.interestRate ? String(data.interestRate) : '0');
      setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '');
      setStatus(data.status || 'ACTIVE');
    } else if (!initialData && isOpen) {
      // Reset logic
      setName('');
      setType('DEBT');
      setPartnerId('');
      setInitialAmount('');
      setRemainingAmount('');
      setInterestRate('0');
      setDueDate('');
      setStatus('ACTIVE');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !partnerId || !dueDate) {
      alert("Por favor completa los campos requeridos (Nombre, Tercero y Fecha de Vencimiento).");
      return;
    }
    if (isNaN(Number(initialAmount)) || Number(initialAmount) < 0) {
      alert("Por favor ingresa un monto inicial válido.");
      return;
    }
    if (isNaN(Number(remainingAmount)) || Number(remainingAmount) < 0) {
      alert("Por favor ingresa un saldo pendiente válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name,
        type,
        partnerId,
        initialAmount: Number(initialAmount),
        remainingAmount: Number(remainingAmount),
        interestRate: Number(interestRate),
        dueDate: new Date(dueDate).toISOString(),
        status,
      };

      if (initialData?.id) {
         await axios.patch(`http://localhost:3000/obligations/${initialData.id}`, payload);
      } else {
         await axios.post('http://localhost:3000/obligations', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Hubo un error al guardar la obligación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const partnerOptions = partners.map(p => ({ value: p.id, label: p.name }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <span className="material-symbols-outlined">{initialData ? 'edit' : 'add_circle'}</span>
            <h2 className="text-lg font-bold tracking-tight">{initialData ? 'Editar Obligación' : 'Nueva Obligación'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nombre */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Nombre de Obligación</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Préstamo Banco X, Pago a Proveedor Y..." className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>

            {/* Tipo & Estado */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tipo</label>
              <select required value={type} onChange={e => setType(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
                <option value="DEBT">Deuda/Préstamo</option>
                <option value="PURCHASE">Compra/Proveedor</option>
                <option value="EXPENSE">Gastos fijos/Servicios</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Estado</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
                <option value="ACTIVE">Pendiente</option>
                <option value="OVERDUE">Vencido</option>
                <option value="PAID">Pagado</option>
              </select>
            </div>

            {/* Acreedor/Deudor (Partner) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Acreedor / Deudor / Proveedor</label>
              <SearchableSelect options={partnerOptions} value={partnerId} onChange={setPartnerId} placeholder="Buscar tercero..." />
            </div>

            {/* Monto Inicial y Saldo Pendiente */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Monto Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input type="number" step="0.01" required value={initialAmount} onChange={e => setInitialAmount(e.target.value)} placeholder="0.00" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 font-black text-slate-900 dark:text-slate-100 placeholder:font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Saldo Pendiente</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input type="number" step="0.01" required value={remainingAmount} onChange={e => setRemainingAmount(e.target.value)} placeholder="0.00" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 font-black text-red-600 dark:text-red-400 placeholder:font-medium focus:ring-2 focus:ring-red-500/20 outline-none transition-all"/>
              </div>
            </div>

            {/* Tasa y Fecha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tasa de Interés (%)</label>
              <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="0.00" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fecha de Vencimiento</label>
              <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none">
              {isSubmitting ? 'Guardando...' : 'Guardar Obligación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
