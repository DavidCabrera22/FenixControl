import { useState, useEffect } from 'react';
import axios from 'axios';
import { SearchableSelect } from './SearchableSelect';
import { CurrencyInput } from './CurrencyInput';

interface TransactionModalProps {
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

interface Category {
  id: string;
  name: string;
}

interface Source {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export const TransactionModal = ({ isOpen, onClose, onSaved, initialData }: TransactionModalProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  const [accountFrom, setAccountFrom] = useState('');
  const [accountTo, setAccountTo] = useState('');
  const [category, setCategory] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [fileName, setFileName] = useState('');
  const [isTransfer, setIsTransfer] = useState(false);

  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/accounts').then(res => setAccounts(res.data)).catch(console.error);
      axios.get('/categories').then(res => setCategories(res.data)).catch(console.error);
      axios.get('/sources').then(res => setSources(res.data)).catch(console.error);
    }

    if (initialData && isOpen) {
      setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setAccountFrom(initialData.accountFrom?.id || initialData.accountFromId || initialData.accountTo?.id || initialData.accountToId || '');
      setAccountTo('');
      setCategory(initialData.categoryId || '');
      setSourceId('');
      setThirdPartyName(initialData.thirdPartyName || '');
      setDescription(initialData.description || '');
      setFileName(initialData.attachmentUrl ? initialData.attachmentUrl.split('/').pop() : '');
      setIsTransfer(false);
    } else if (!initialData && isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setAccountFrom('');
      setAccountTo('');
      setCategory('');
      setSourceId('');
      setThirdPartyName('');
      setDescription('');
      setFileName('');
      setIsTransfer(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const selectedSource = sources.find(s => s.id === sourceId);
  const derivedType = selectedSource?.type ?? 'INCOME';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }
    if (!accountFrom) {
      alert('Debes seleccionar una Cuenta.');
      return;
    }
    if (isTransfer && !accountTo) {
      alert('Para transferencias debes seleccionar Cuenta Destino.');
      return;
    }

    try {
      setIsSubmitting(true);
      const base = {
        date,
        amount: Number(amount),
        categoryId: category || undefined,
        description: description || undefined,
        thirdPartyName: thirdPartyName || undefined,
        attachmentUrl: fileName ? `https://dummy-bucket.s3.amazonaws.com/${fileName}` : undefined,
      };

      if (initialData?.id) {
        const payload = derivedType === 'INCOME'
          ? { ...base, type: 'INCOME', accountToId: accountFrom, accountFromId: undefined }
          : { ...base, type: 'EXPENSE', accountFromId: accountFrom, accountToId: undefined };
        await axios.patch(`/transactions/${initialData.id}`, payload);
      } else if (isTransfer) {
        await axios.post('/transactions', { ...base, type: 'EXPENSE', accountFromId: accountFrom, description: description || 'Transferencia - Salida' });
        await axios.post('/transactions', { ...base, type: 'INCOME', accountToId: accountTo, description: description || 'Transferencia - Entrada' });
      } else if (derivedType === 'INCOME') {
        await axios.post('/transactions', { ...base, type: 'INCOME', accountToId: accountFrom });
      } else {
        await axios.post('/transactions', { ...base, type: 'EXPENSE', accountFromId: accountFrom });
      }

      onSaved();
      setFileName('');
      setAccountFrom('');
      setAccountTo('');
      setCategory('');
      setSourceId('');
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setThirdPartyName('');
      setDescription('');
      setIsTransfer(false);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al guardar el movimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const sourceOptions = sources.map(s => ({ value: s.id, label: s.name }));

  const accFrom = accounts.find(a => a.id === accountFrom);
  const accTo = accounts.find(a => a.id === accountTo);

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

            {/* Fecha & Fuente */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fecha</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fuente</label>
              <SearchableSelect options={sourceOptions} value={sourceId} onChange={setSourceId} placeholder="Buscar fuente..." />
              {selectedSource && (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedSource.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  <span className="material-symbols-outlined text-[12px]">{selectedSource.type === 'INCOME' ? 'trending_up' : 'trending_down'}</span>
                  {selectedSource.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                </div>
              )}
            </div>

            {/* Monto */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <CurrencyInput required value={amount} onChange={setAmount} placeholder="0" className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-4 text-lg font-black text-slate-900 dark:text-slate-100 placeholder:font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"/>
              </div>
            </div>

            {/* Cuenta */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTransfer ? 'Cuenta Origen' : 'Cuenta'}
              </label>
              <SearchableSelect options={accountOptions} value={accountFrom} onChange={setAccountFrom} placeholder="Buscar cuenta..." />
              {accFrom && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                  <span>Disponible: <span className="font-bold text-slate-800 dark:text-slate-200">${Number(accFrom.currentBalance).toLocaleString('es-CO')}</span></span>
                </div>
              )}
            </div>

            {/* Cuenta Destino — solo si es transferencia */}
            {isTransfer && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Cuenta Destino</label>
                <SearchableSelect options={accountOptions} value={accountTo} onChange={setAccountTo} placeholder="Buscar cuenta..." />
                {accTo && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                    <span>Disponible: <span className="font-bold text-slate-800 dark:text-slate-200">${Number(accTo.currentBalance).toLocaleString('es-CO')}</span></span>
                  </div>
                )}
              </div>
            )}

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

          {/* Botón de transferencia */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => { setIsTransfer(!isTransfer); setAccountTo(''); }}
              className={`w-full py-2.5 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all ${isTransfer ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/50 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              {isTransfer ? 'Cancelar transferencia' : 'Es una transferencia entre cuentas'}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none">
              {isSubmitting ? 'Guardando...' : isTransfer ? 'Guardar Transferencia' : 'Guardar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
