import { useState, useEffect } from 'react';
import axios from 'axios';
import { clsx } from 'clsx';
import { SearchableSelect } from './SearchableSelect';
import { createTransactionReport, type ReportTransaction } from '../lib/transactionReport';

interface TransactionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = 'detailed' | 'summary';
type Step = 'filters' | 'preview';

export const TransactionReportModal = ({ isOpen, onClose }: TransactionReportModalProps) => {
  const [step, setStep] = useState<Step>('filters');
  const [reportType, setReportType] = useState<ReportType>('detailed');

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedThirdParty, setSelectedThirdParty] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // Data lists
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [thirdParties, setThirdParties] = useState<{ id: string; name: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);

  // Report data
  const [allTransactions, setAllTransactions] = useState<ReportTransaction[]>([]);
  const [filteredData, setFilteredData] = useState<ReportTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [reportUrl, setReportUrl] = useState('');
  const [reportError, setReportError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    return () => { if (reportUrl) URL.revokeObjectURL(reportUrl); };
  }, [reportUrl]);

  useEffect(() => {
    if (isOpen) {
      setStep('filters');
      setIsLoading(true);
      setReportError('');
      setLoadFailed(false);
      let cancelled = false;
      Promise.all([
        axios.get('/categories'),
        axios.get('/third-parties'),
        axios.get('/partners'),
        axios.get('/transactions'),
        axios.get('/accounts'),
      ]).then(([catRes, tpRes, pRes, txRes, accRes]) => {
        if (cancelled) return;
        setAccounts(accRes.data);
        setCategories(catRes.data);
        setThirdParties(tpRes.data);
        setPartners(pRes.data);
        setAllTransactions(txRes.data);
      }).catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          setReportError('No se pudieron cargar los movimientos. Cierra el reporte e inténtalo de nuevo.');
        }
      }).finally(() => {
        if (!cancelled) setIsLoading(false);
      });
      return () => { cancelled = true; };
    } else {
      setDateFrom('');
      setDateTo('');
      setSelectedCategory('');
      setSelectedThirdParty('');
      setSelectedPartner('');
      setSelectedAccount('');
      setReportType('detailed');
      setFilteredData([]);
      setReportUrl('');
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) return;
    setReportError('');
    setIsLoading(true);
    let result = [...allTransactions];

    if (dateFrom) result = result.filter(t => t.date.slice(0, 10) >= dateFrom);
    if (dateTo) result = result.filter(t => t.date.slice(0, 10) <= dateTo);
    if (selectedAccount) {
      result = result.filter(t => t.accountFrom?.id === selectedAccount || t.accountTo?.id === selectedAccount);
    }
    if (selectedCategory) {
      result = result.filter(t => t.category?.id === selectedCategory);
    }
    if (selectedThirdParty) {
      const tpName = thirdParties.find(tp => tp.id === selectedThirdParty)?.name;
      if (tpName) result = result.filter(t => t.thirdPartyName === tpName);
    }
    if (selectedPartner) {
      result = result.filter(t => t.partner?.id === selectedPartner);
    }

    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    try {
      const pdf = createTransactionReport({ transactions: result, type: reportType, filters: activeFilters });
      setReportUrl(URL.createObjectURL(pdf.output('blob')));
      setFilteredData(result);
      setStep('preview');
    } catch (error) {
      console.error('Error generating report', error);
      setReportError('No se pudo generar el reporte. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportUrl) return;
    setIsExporting(true);
    try {
      const link = document.createElement('a');
      link.href = reportUrl;
      const period = [dateFrom, dateTo].filter(Boolean).join('_al_') || new Date().toISOString().slice(0, 10);
      link.download = `Fenix_Movimientos_${reportType === 'detailed' ? 'Detallado' : 'Resumido'}_${period}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  // Active filter labels
  const activeFilters: string[] = [];
  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Inicio';
    const to = dateTo ? new Date(dateTo + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Sin fecha final';
    activeFilters.push(`${from} — ${to}`);
  }
  if (selectedAccount) activeFilters.push(`Cuenta: ${accounts.find(a => a.id === selectedAccount)?.name}`);
  if (selectedCategory) activeFilters.push(`Categoría: ${categories.find(c => c.id === selectedCategory)?.name}`);
  if (selectedThirdParty) activeFilters.push(`Tercero: ${thirdParties.find(t => t.id === selectedThirdParty)?.name}`);
  if (selectedPartner) activeFilters.push(`Sociedad: ${partners.find(p => p.id === selectedPartner)?.name}`);


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full ${step === 'preview' ? 'max-w-7xl' : 'max-w-5xl'} max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <button aria-label="Volver a los filtros" onClick={() => setStep('filters')} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}
            <div className="flex items-center gap-3 text-primary dark:text-white">
              <span className="material-symbols-outlined">{step === 'filters' ? 'tune' : 'description'}</span>
              <h2 className="text-lg font-bold tracking-tight">
                {step === 'filters' ? 'Configurar Reporte' : 'Vista Previa del Reporte'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step === 'preview' && (
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-lg">{isExporting ? 'progress_activity' : 'picture_as_pdf'}</span>
                {isExporting ? 'Exportando...' : 'Descargar PDF'}
              </button>
            )}
            <button aria-label="Cerrar reporte" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'filters' && (
            <div className="p-6 space-y-8">
              {/* Step indicator */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">1</span>
                  Filtros
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>
                  Tipo de Reporte
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-xs font-bold">3</span>
                  Generar
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">calendar_month</span>
                    Rango de Fechas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Desde</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Hasta</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom || undefined} className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">filter_alt</span>
                    Filtros Opcionales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Cuenta */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Cuenta</label>
                      <SearchableSelect
                        options={[{ value: '', label: 'Todas las cuentas' }, ...accounts.map(a => ({ value: a.id, label: a.name }))]}
                        value={selectedAccount}
                        onChange={setSelectedAccount}
                        placeholder="Todas las cuentas..."
                      />
                    </div>

                    {/* Categoría */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Categoría</label>
                      <SearchableSelect
                        options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="Todas las categorías..."
                      />
                    </div>

                    {/* Tercero */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Tercero</label>
                      <SearchableSelect
                        options={thirdParties.map(t => ({ value: t.id, label: t.name }))}
                        value={selectedThirdParty}
                        onChange={setSelectedThirdParty}
                        placeholder="Todos los terceros..."
                      />
                    </div>

                    {/* Sociedad */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Sociedad</label>
                      <SearchableSelect
                        options={partners.map(p => ({ value: p.id, label: p.name }))}
                        value={selectedPartner}
                        onChange={setSelectedPartner}
                        placeholder="Todas las sociedades..."
                      />
                    </div>
                  </div>
                </div>

                {/* Report Type Toggle */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">switch_access_shortcut</span>
                    Tipo de Reporte
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReportType('detailed')}
                      className={clsx(
                        "relative p-4 rounded-xl border-2 text-left transition-all",
                        reportType === 'detailed'
                          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      {reportType === 'detailed' && (
                        <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-lg">check_circle</span>
                      )}
                      <span className="material-symbols-outlined text-2xl mb-2 block text-primary">table_rows</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Detallado</p>
                      <p className="text-xs text-slate-500 mt-1">Muestra cada movimiento individualmente con todos sus campos</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('summary')}
                      className={clsx(
                        "relative p-4 rounded-xl border-2 text-left transition-all",
                        reportType === 'summary'
                          ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      {reportType === 'summary' && (
                        <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-lg">check_circle</span>
                      )}
                      <span className="material-symbols-outlined text-2xl mb-2 block text-primary">summarize</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Resumido</p>
                      <p className="text-xs text-slate-500 mt-1">Agrupa ingresos y gastos por categoría, fuente y tercero</p>
                    </button>
                  </div>
                </div>
              </div>

              {reportError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{reportError}</p>}
              {dateFrom && dateTo && dateFrom > dateTo && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">La fecha inicial debe ser anterior o igual a la fecha final.</p>}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || loadFailed || !!(dateFrom && dateTo && dateFrom > dateTo)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  {isLoading ? 'Cargando movimientos...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="bg-slate-100 dark:bg-slate-950 p-3 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {reportType === 'detailed' ? 'Detalle de movimientos' : 'Resumen por categoría y fuente'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {filteredData.length} movimientos · {reportType === 'detailed' ? 'A4 horizontal' : 'A4 vertical'} · Valores en COP
                  </p>
                </div>
                <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary dark:text-teal-300 hover:underline">
                  Abrir en otra pestaña
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </a>
              </div>
              <iframe
                src={`${reportUrl}#toolbar=1&navpanes=0&view=FitH`}
                title="Vista previa del reporte de movimientos en PDF"
                className="w-full h-[65vh] min-h-[360px] rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700"
              />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Esta vista muestra el PDF que se descargará. Si tu navegador no muestra la vista previa, abre el reporte en otra pestaña o descárgalo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
