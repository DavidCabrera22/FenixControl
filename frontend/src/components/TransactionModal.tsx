import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchableSelect } from './SearchableSelect';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export const TransactionModal = ({ isOpen, onClose, onSaved, initialData }: TransactionModalProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountFrom, setAccountFrom] = useState('');
  const [accountTo, setAccountTo] = useState('');
  const [category, setCategory] = useState('');
  const [fileName, setFileName] = useState('');
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('INCOME');
  const [amount, setAmount] = useState('');
  const [sourceData, setSourceData] = useState('');
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get("/accounts").then(res => setAccounts(res.data)).catch(console.error);
      axios.get("/categories").then(res => setCategories(res.data)).catch(console.error);
    }
    
    if (initialData && isOpen) {
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setType(initialData.type || 'INCOME');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setAccountFrom(initialData.accountFrom?.id || initialData.accountFromId || '');
      setAccountTo(initialData.accountTo?.id || initialData.accountToId || '');
      setCategory(initialData.categoryId || '');
      setThirdPartyName(initialData.thirdPartyName || '');
      setDescription(initialData.description || '');
      setFileName(initialData.attachmentUrl ? initialData.attachmentUrl.split('/').pop() : '');
    } else if (!initialData && isOpen) {
      // Reset logic
      setDate(new Date().toISOString().split('T')[0]);
      setType('INCOME');
      setAmount('');
      setAccountFrom('');
      setAccountTo('');
      setCategory('');
      setThirdPartyName('');
      setDescription('');
      setFileName('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("Por favor ingresa un monto válido.");
      return;
    }
    if (type === 'INCOME' && !accountTo) {
      alert("Para ingresos, debes seleccionar una Cuenta Destino.");
      return;
    }
    if (type === 'EXPENSE' && !accountFrom) {
      alert("Para gastos, debes seleccionar una Cuenta Origen.");
      return;
    }
    if (type === 'TRANSFER' && (!accountFrom || !accountTo)) {
      alert("Para transferencias, debes seleccionar Cuenta Origen y Destino.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        date,
        type,
        amount: Number(amount),
        accountFromId: accountFrom || undefined,
        accountToId: accountTo || undefined,
        categoryId: category || undefined,
        description: description || undefined,
        thirdPartyName: thirdPartyName || undefined,
        attachmentUrl: fileName ? `https://dummy-bucket.s3.amazonaws.com/${fileName}` : undefined,
      };

      if (initialData?.id) {
         await axios.patch(`/transactions/${initialData.id}`, payload);
      } else {
         await axios.post("/transactions" , payload);
      }

      onSaved();
      // Reset form
      setFileName('');
      setAccountFrom('');
      setAccountTo('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('INCOME');
      setAmount('');
      setSourceData('');
      setThirdPartyName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
      alert("Hubo un error al guardar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <span className="material-symbols-outlined">{initialData ? 'edit' : 'add_circle'}</span>
            <h2 className="text-lg font-bold tracking-tight">{initialData ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Fecha & Tipo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fecha</label>
              <div className="relative">
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tipo de movimiento</label>
              <select required value={type} onChange={e => setType(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer">
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Gasto</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </div>

            {/* Monto */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 text-lg font-black text-slate-900 dark:text-slate-100 placeholder:font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>

            {/* Cuentas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta Origen</label>
              <SearchableSelect options={accountOptions} value={accountFrom} onChange={setAccountFrom} placeholder="Buscar cuenta..." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta Destino</label>
              <SearchableSelect options={accountOptions} value={accountTo} onChange={setAccountTo} placeholder="Buscar cuenta..." />
            </div>

            {/* Fuentede Fondos */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fuente de Fondos</label>
                <button type="button" className="text-[10px] font-bold text-primary dark:text-slate-400 hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">call_split</span>
                  Dividir fuente
                </button>
              </div>
              <input type="text" value={sourceData} onChange={e => setSourceData(e.target.value)} placeholder="Ej: Venta de servicios" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>

            {/* Categoria & Tercero */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Categoría</label>
              <SearchableSelect options={categoryOptions} value={category} onChange={setCategory} placeholder="Buscar categoría..." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tercero</label>
              <input type="text" value={thirdPartyName} onChange={e => setThirdPartyName(e.target.value)} placeholder="Nombre cliente/proveedor" className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>

            {/* Notas */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Notas / Descripción</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"></textarea>
            </div>

            {/* Adjunto */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Adjuntar comprobante</label>
              <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/50 transition-all group relative">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} />
                <span className="material-symbols-outlined text-3xl text-primary dark:text-slate-400 group-hover:text-primary transition-colors mb-2">
                  {fileName ? 'check_circle' : 'upload_file'}
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  {fileName ? (
                    <span className="text-primary font-bold">{fileName}</span>
                  ) : (
                    'Haz clic para subir o arrastra el archivo (PDF, JPG, PNG)'
                  )}
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none">
              {isSubmitting ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
