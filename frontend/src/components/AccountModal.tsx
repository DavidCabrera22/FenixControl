import { useState, useEffect } from 'react';
import axios from 'axios';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: any; // If provided, it's edit mode
}

export const AccountModal = ({ isOpen, onClose, onSaved, initialData }: AccountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    initialBalance: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          type: initialData.type,
          initialBalance: initialData.initialBalance.toString(),
        });
      } else {
        setFormData({
          name: '',
          type: 'BANK',
          initialBalance: '',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (initialData) {
        // Edit
        await axios.patch(`http://localhost:3000/accounts/${initialData.id}`, {
          ...formData,
          initialBalance: Number(formData.initialBalance),
        });
      } else {
        // Create (backend creates currentBalance equal to initialBalance)
        await axios.post('http://localhost:3000/accounts', {
          ...formData,
          initialBalance: Number(formData.initialBalance),
          currentBalance: Number(formData.initialBalance),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving account form", err);
      alert("Hubo un error al guardar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${initialData ? 'bg-primary/10 text-primary' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
              <span className="material-symbols-outlined text-sm">{initialData ? 'edit' : 'account_balance'}</span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {initialData ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de la cuenta</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Bancolombia, Caja Principal..." 
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white placeholder:text-slate-400" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de cuenta</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
            >
              <option value="BANK">Bancaria</option>
              <option value="CASH">Caja</option>
              <option value="POCKET">Bolsillo</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Inicial</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
              <input 
                required
                type="number" 
                step="0.01"
                value={formData.initialBalance}
                onChange={e => setFormData({...formData, initialBalance: e.target.value})}
                placeholder="0.00" 
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white" 
              />
            </div>
            {initialData && <p className="text-[10px] text-amber-500 mt-1"><span className="material-symbols-outlined text-[10px] align-middle mr-1">warning</span>Modificar el saldo inicial alterará el saldo actual.</p>}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 gap-3 flex">
             <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                disabled={loading}
             >
               Cancelar
             </button>
             <button 
                type="submit" 
                className="flex-1 px-4 py-2 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
                disabled={loading}
             >
               {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
               Guardar Cuenta
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
