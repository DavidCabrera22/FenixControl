import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { clsx } from 'clsx';
import { formatCurrency } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Transaction {
  id: string;
  type: string;
  amount: string | number;
  description?: string;
  thirdPartyName?: string;
  date: string;
  accountFrom?: { id: string; name: string };
  accountTo?: { id: string; name: string };
  category?: { id: string; name: string };
  partner?: { id: string; name: string };
  transactionSources?: { sourceId: string; amount: string | number; source: { id: string; name: string } }[];
}

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

  // Data lists
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [thirdParties, setThirdParties] = useState<{ id: string; name: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);

  // Report data
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredData, setFilteredData] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('filters');
      Promise.all([
        axios.get('/categories'),
        axios.get('/third-parties'),
        axios.get('/partners'),
        axios.get('/transactions'),
      ]).then(([catRes, tpRes, pRes, txRes]) => {
        setCategories(catRes.data);
        setThirdParties(tpRes.data);
        setPartners(pRes.data);
        setAllTransactions(txRes.data);
      }).catch(console.error);
    } else {
      setDateFrom('');
      setDateTo('');
      setSelectedCategory('');
      setSelectedThirdParty('');
      setSelectedPartner('');
      setReportType('detailed');
      setFilteredData([]);
    }
  }, [isOpen]);

  const handleGenerate = () => {
    setIsLoading(true);
    let result = [...allTransactions];

    if (dateFrom) result = result.filter(t => t.date.slice(0, 10) >= dateFrom);
    if (dateTo) result = result.filter(t => t.date.slice(0, 10) <= dateTo);
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
    setFilteredData(result);
    setStep('preview');
    setIsLoading(false);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        let position = 0;
        let remaining = pdfHeight;
        while (remaining > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          remaining -= pageHeight;
          position -= pageHeight;
          if (remaining > 0) pdf.addPage();
        }
      }

      const dateSuffix = new Date().toISOString().split('T')[0];
      pdf.save(`Reporte_Movimientos_${dateSuffix}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Hubo un error generando el PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  // Compute summary data
  const totalIncome = filteredData.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filteredData.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
  const totalNet = totalIncome - totalExpense;

  const summaryBySource: Record<string, { name: string; income: number; expense: number }> = {};
  filteredData.forEach(t => {
    if (t.transactionSources && t.transactionSources.length > 0) {
      t.transactionSources.forEach(ts => {
        const name = ts.source?.name ?? 'Sin fuente';
        if (!summaryBySource[name]) summaryBySource[name] = { name, income: 0, expense: 0 };
        if (t.type === 'INCOME') summaryBySource[name].income += Number(ts.amount);
        else if (t.type === 'EXPENSE') summaryBySource[name].expense += Number(ts.amount);
      });
    } else {
      const name = 'Sin fuente';
      if (!summaryBySource[name]) summaryBySource[name] = { name, income: 0, expense: 0 };
      if (t.type === 'INCOME') summaryBySource[name].income += Number(t.amount);
      else if (t.type === 'EXPENSE') summaryBySource[name].expense += Number(t.amount);
    }
  });
  const summaryRows = Object.values(summaryBySource).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

  // Active filter labels
  const activeFilters: string[] = [];
  if (dateFrom || dateTo) {
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Inicio';
    const to = dateTo ? new Date(dateTo + 'T00:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'Hoy';
    activeFilters.push(`${from} — ${to}`);
  }
  if (selectedCategory) activeFilters.push(`Categoría: ${categories.find(c => c.id === selectedCategory)?.name}`);
  if (selectedThirdParty) activeFilters.push(`Tercero: ${thirdParties.find(t => t.id === selectedThirdParty)?.name}`);
  if (selectedPartner) activeFilters.push(`Socio: ${partners.find(p => p.id === selectedPartner)?.name}`);


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 dark:bg-background-dark/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <button onClick={() => setStep('filters')} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Categoría */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Categoría</label>
                      <SearchableSelect
                        options={categories.map(c => ({ value: c.id, label: c.name }))}
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

                    {/* Socio */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500">Socio</label>
                      <SearchableSelect
                        options={partners.map(p => ({ value: p.id, label: p.name }))}
                        value={selectedPartner}
                        onChange={setSelectedPartner}
                        placeholder="Todos los socios..."
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
                      <p className="text-xs text-slate-500 mt-1">Muestra las fuentes con el valor total consolidado por fuente</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  {isLoading ? 'Generando...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="p-6">
              {/* Printable Report Area */}
              <div ref={reportRef} className="bg-white rounded-xl p-8 space-y-6" style={{ color: '#0f172a' }}>
                {/* Report Header */}
                <div className="text-center border-b-2 border-slate-800 pb-6">
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: '#0f172a' }}>Fenix Control</h1>
                  <p className="text-sm font-medium mt-1" style={{ color: '#64748b' }}>
                    Reporte de Movimientos {reportType === 'detailed' ? '— Detallado' : '— Resumido'}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
                    Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {activeFilters.map((f, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  {activeFilters.length === 0 && (
                    <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>Sin filtros aplicados — Todos los movimientos</p>
                  )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#16a34a' }}>Total Ingresos</p>
                    <p className="text-xl font-black mt-1" style={{ color: '#15803d' }}>{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#dc2626' }}>Total Gastos</p>
                    <p className="text-xl font-black mt-1" style={{ color: '#dc2626' }}>{formatCurrency(totalExpense)}</p>
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Balance Neto</p>
                    <p className="text-xl font-black mt-1" style={{ color: totalNet >= 0 ? '#15803d' : '#dc2626' }}>{formatCurrency(totalNet)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                    Total movimientos: <span className="font-bold" style={{ color: '#0f172a' }}>{filteredData.length}</span>
                  </p>
                </div>

                {/* Detailed Table */}
                {reportType === 'detailed' && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Fecha</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Tipo</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Descripcion</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Fuente</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Categoria</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Socio</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Tercero</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-right" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>
                              No se encontraron movimientos con los filtros seleccionados
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((tx, i) => (
                            <tr key={tx.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                              <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#334155' }}>
                                {new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded" style={{
                                  backgroundColor: tx.type === 'INCOME' ? '#dcfce7' : tx.type === 'EXPENSE' ? '#ffe4e6' : '#e0e7ff',
                                  color: tx.type === 'INCOME' ? '#15803d' : tx.type === 'EXPENSE' ? '#dc2626' : '#4338ca',
                                }}>
                                  {tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : 'Transf.'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs font-medium max-w-[150px] truncate" style={{ color: '#334155' }} title={tx.description}>
                                {tx.description || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>
                                {tx.transactionSources?.map(ts => ts.source?.name).filter(Boolean).join(', ') || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>
                                {tx.category?.name || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>
                                {tx.partner?.name || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: '#64748b' }}>
                                {tx.thirdPartyName || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-bold text-right" style={{
                                color: tx.type === 'INCOME' ? '#15803d' : tx.type === 'EXPENSE' ? '#dc2626' : '#0f172a'
                              }}>
                                {tx.type === 'EXPENSE' ? '-' : ''}{formatCurrency(Number(tx.amount))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredData.length > 0 && (
                        <tfoot>
                          <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                            <td colSpan={7} className="px-4 py-3 text-xs font-black uppercase tracking-wider" style={{ color: '#334155' }}>
                              Totales
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-xs font-bold" style={{ color: '#15803d' }}>+{formatCurrency(totalIncome)}</div>
                              <div className="text-xs font-bold" style={{ color: '#dc2626' }}>-{formatCurrency(totalExpense)}</div>
                              <div className="text-sm font-black mt-1 pt-1" style={{ color: totalNet >= 0 ? '#15803d' : '#dc2626', borderTop: '1px solid #cbd5e1' }}>
                                {formatCurrency(totalNet)}
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}

                {/* Summary Table */}
                {reportType === 'summary' && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Fuente</th>
                          <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-right" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Ingresos</th>
                          <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-right" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Gastos</th>
                          <th className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-right" style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>
                              No se encontraron movimientos con los filtros seleccionados
                            </td>
                          </tr>
                        ) : (
                          summaryRows.map((row, i) => (
                            <tr key={row.name} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                              <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#334155' }}>{row.name}</td>
                              <td className="px-5 py-3 text-sm font-bold text-right" style={{ color: '#15803d' }}>{formatCurrency(row.income)}</td>
                              <td className="px-5 py-3 text-sm font-bold text-right" style={{ color: '#dc2626' }}>{formatCurrency(row.expense)}</td>
                              <td className="px-5 py-3 text-sm font-black text-right" style={{ color: row.income - row.expense >= 0 ? '#15803d' : '#dc2626' }}>
                                {formatCurrency(row.income - row.expense)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {summaryRows.length > 0 && (
                        <tfoot>
                          <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                            <td className="px-5 py-3.5 text-sm font-black uppercase" style={{ color: '#334155' }}>Total</td>
                            <td className="px-5 py-3.5 text-sm font-black text-right" style={{ color: '#15803d' }}>{formatCurrency(totalIncome)}</td>
                            <td className="px-5 py-3.5 text-sm font-black text-right" style={{ color: '#dc2626' }}>{formatCurrency(totalExpense)}</td>
                            <td className="px-5 py-3.5 text-sm font-black text-right" style={{ color: totalNet >= 0 ? '#15803d' : '#dc2626' }}>{formatCurrency(totalNet)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 text-center" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p className="text-[10px]" style={{ color: '#94a3b8' }}>
                    Fenix Control — Reporte generado automaticamente. Este documento es informativo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
