import { jsPDF } from 'jspdf';
import { formatCurrency } from './utils';

export interface ReportTransaction {
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

export interface TransactionReportOptions {
  transactions: ReportTransaction[];
  type: 'detailed' | 'summary';
  filters: string[];
  generatedAt?: Date;
}

const colors = {
  ink: '#172D3B', muted: '#526575', teal: '#087F82', line: '#DCE5EA',
  light: '#F3F7F9', green: '#146746', red: '#AD343E', white: '#FFFFFF',
};

type Cell = { text: string; color?: string; bold?: boolean };
type Column = { label: string; width: number; align?: 'right' };

/** A vector document: physical page sizes, selectable text and explicit row pagination. */
export function createTransactionReport({ transactions, type, filters, generatedAt = new Date() }: TransactionReportOptions) {
  const detailed = type === 'detailed';
  const pdf = new jsPDF({ orientation: detailed ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'Reporte de movimientos | Fenix Control', author: 'Fenix Control', subject: detailed ? 'Detalle de movimientos' : 'Resumen por categoría y fuente' });
  pdf.setLanguage('es-CO');
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = width - margin * 2;
  const bottom = height - 20;
  const lineHeight = 4.3;
  const fontSize = 9;
  let y = 0;
  let columns: Column[] = [];
  let continuation = '';
  const money = (value: number) => formatCurrency(value).replace(/\u00a0|\u202f/g, ' ');
  const date = (value: Date) => value.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const write = (text: string | string[], x: number, top: number, size = fontSize, color = colors.ink, bold = false, align: 'left' | 'right' = 'left') => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    (Array.isArray(text) ? text : [text]).forEach((line, index) => {
      pdf.text(line, x, top + index * lineHeight, { baseline: 'top', align, lineHeightFactor: 1.15 });
    });
  };
  const wrap = (text: string, available: number, size = fontSize, bold = false): string[] => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    return pdf.splitTextToSize(text.replace(/\t/g, ' ').replace(/\u00a0|\u202f/g, ' '), available);
  };
  const fill = (x: number, top: number, w: number, h: number, color: string) => {
    pdf.setFillColor(color);
    pdf.rect(x, top, w, h, 'F');
  };
  const rule = (top: number) => {
    pdf.setDrawColor(colors.line);
    pdf.setLineWidth(0.2);
    pdf.line(margin, top, width - margin, top);
  };
  const pageHeader = (first: boolean) => {
    fill(0, 0, width, 2, colors.teal);
    write('FENIX', margin, 11, 16, colors.ink, true);
    write('CONTROL', margin + 21, 12.5, 10, colors.teal, true);
    write('REPORTE FINANCIERO  /  COP', width - margin, 13, 8, colors.muted, true, 'right');
    rule(23);
    y = 29;
    if (first) {
      write('Reporte de movimientos', margin, y, 24, colors.ink, true);
      y += 12;
      write(detailed ? 'Detalle de operaciones' : 'Resumen por categoría, fuente y tercero', margin, y, 11, colors.muted);
      y += 8;
    } else {
      write(detailed ? 'Detalle de movimientos' : 'Resumen de movimientos', margin, y, 12, colors.ink, true);
      y += 9;
    }
  };
  const tableHeader = () => {
    fill(margin, y, contentWidth, 9, colors.ink);
    let x = margin;
    columns.forEach(column => {
      write(column.label, column.align === 'right' ? x + column.width - 3 : x + 3, y + 2.7, 8, colors.white, true, column.align);
      x += column.width;
    });
    y += 9;
  };
  const nextPage = () => {
    pdf.addPage();
    pageHeader(false);
    if (continuation) {
      const lines = wrap(`${continuation} (continuación)`, contentWidth, 10, true);
      write(lines, margin, y, 10, colors.teal, true);
      y += lines.length * lineHeight + 4;
    }
    if (columns.length) tableHeader();
  };
  const ensure = (space: number) => { if (y + space > bottom) nextPage(); };
  const row = (cells: Cell[], background = colors.white, keepWithNext = false) => {
    const lines = cells.map((cell, i) => wrap(cell.text || '—', columns[i].width - 6, fontSize, cell.bold));
    const count = Math.max(...lines.map(cell => cell.length));
    const rowHeight = count * lineHeight + 6;
    // Ordinary rows stay intact; exceptionally long notes continue without dropping text.
    if (y + rowHeight + (keepWithNext ? 12 : 0) > bottom && rowHeight < bottom - 65) nextPage();
    let offset = 0;
    while (offset < count) {
      if (bottom - y < lineHeight + 6) nextPage();
      const capacity = Math.max(1, Math.floor((bottom - y - 6) / lineHeight));
      const take = Math.min(count - offset, capacity);
      const h = take * lineHeight + 6;
      fill(margin, y, contentWidth, h, background);
      let x = margin;
      cells.forEach((cell, i) => {
        const visible = lines[i].slice(offset, offset + take);
        if (visible.length) write(visible, columns[i].align === 'right' ? x + columns[i].width - 3 : x + 3, y + 3, fontSize, cell.color || colors.ink, cell.bold, columns[i].align);
        x += columns[i].width;
      });
      y += h;
      rule(y);
      offset += take;
      if (offset < count) nextPage();
    }
  };

  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
  const transfers = transactions.filter(t => t.type === 'TRANSFER');
  pageHeader(true);
  for (const filter of filters.length ? filters : ['Todos los movimientos · Sin filtros aplicados']) {
    for (const line of wrap(filter, contentWidth, 9)) {
      ensure(8);
      write(line, margin, y, 9, colors.muted);
      y += lineHeight;
    }
  }
  y += 6;
  ensure(44);
  const cardWidth = (contentWidth - 8) / 3;
  [
    { label: 'TOTAL INGRESOS', value: income, color: colors.green },
    { label: 'TOTAL GASTOS', value: expense, color: colors.red },
    { label: 'BALANCE NETO', value: income - expense, color: colors.ink },
  ].forEach((card, i) => {
    const x = margin + i * (cardWidth + 4);
    fill(x, y, cardWidth, 25, colors.light);
    fill(x, y, 1, 25, card.color);
    write(card.label, x + 4, y + 5, 8, card.color, true);
    const value = money(card.value);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    const size = Math.min(17, 17 * (cardWidth - 8) / pdf.getTextWidth(value));
    write(value, x + 4, y + 12, size, card.color, true);
  });
  y += 31;
  write(`${transactions.length} movimientos  ·  Valores en pesos colombianos (COP)`, margin, y, 9, colors.muted);
  y += 7;
  if (transfers.length) {
    write(`${transfers.length} transferencias por ${money(transfers.reduce((sum, t) => sum + Number(t.amount), 0))} · No afectan el balance neto.`, margin, y, 8, colors.muted);
    y += 7;
  }
  y += 3;

  if (!transactions.length) {
    ensure(20);
    fill(margin, y, contentWidth, 20, colors.light);
    write('No se encontraron movimientos con los filtros seleccionados.', margin + 5, y + 7, 10, colors.muted);
  } else if (detailed) {
    ensure(24);
    columns = [
      { label: 'FECHA / TIPO', width: 28 },
      { label: 'DESCRIPCIÓN / CUENTA', width: contentWidth - 166 },
      { label: 'FUENTE / CATEGORÍA', width: 53 },
      { label: 'TERCERO / SOCIEDAD', width: 48 },
      { label: 'MONTO', width: 37, align: 'right' },
    ];
    tableHeader();
    transactions.forEach((tx, i) => {
      const label = tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Gasto' : 'Transferencia';
      const txDate = new Date(tx.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
      const account = tx.type === 'TRANSFER' ? `${tx.accountFrom?.name || '—'} > ${tx.accountTo?.name || '—'}` : (tx.type === 'INCOME' ? tx.accountTo?.name : tx.accountFrom?.name);
      row([
        { text: `${txDate}\n${label}`, bold: true },
        { text: `${tx.description || 'Sin descripción'}\nCuenta: ${account || 'Sin cuenta'}` },
        { text: `${tx.transactionSources?.map(source => source.source?.name || 'Sin fuente').join(', ') || 'Sin fuente'}\nCategoría: ${tx.category?.name || 'Sin categoría'}` },
        { text: `${tx.thirdPartyName || 'Sin tercero'}\nSociedad: ${tx.partner?.name || 'Sin sociedad'}` },
        { text: `${tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}${money(Number(tx.amount))}`, bold: true, color: tx.type === 'INCOME' ? colors.green : tx.type === 'EXPENSE' ? colors.red : colors.ink },
      ], i % 2 ? colors.light : colors.white);
    });
  } else {
    // Maps preserve arbitrary category/source names (including object property names).
    const categories = new Map<string, ReportTransaction[]>();
    transactions.filter(t => t.type === 'INCOME' || t.type === 'EXPENSE').forEach(tx => {
      const name = tx.category?.name || 'Sin categoría';
      categories.set(name, [...(categories.get(name) || []), tx]);
    });
    const activity = (items: ReportTransaction[]) => items.reduce((sum, t) => sum + Number(t.amount), 0);
    for (const [name, items] of [...categories].sort((a, b) => activity(b[1]) - activity(a[1]))) {
      columns = [];
      continuation = '';
      const titleLines = wrap(name, contentWidth - 8, 12, true);
      ensure(titleLines.length * lineHeight + 48);
      const headingHeight = titleLines.length * lineHeight + 8;
      fill(margin, y, contentWidth, headingHeight, colors.ink);
      write(titleLines, margin + 4, y + 4, 12, colors.white, true);
      y += headingHeight + 3;
      const net = items.reduce((sum, t) => sum + (t.type === 'INCOME' ? 1 : -1) * Number(t.amount), 0);
      write(`Balance de la categoría: ${money(net)}`, margin + 3, y, 9, colors.muted, true);
      y += 8;
      continuation = name;
      for (const group of ['INCOME', 'EXPENSE']) {
        const matching = items.filter(t => t.type === group);
        if (!matching.length) continue;
        const color = group === 'INCOME' ? colors.green : colors.red;
        const label = group === 'INCOME' ? 'INGRESOS' : 'GASTOS';
        columns = [];
        ensure(25);
        columns = [{ label: `${label} / FUENTE Y TERCERO`, width: contentWidth - 42 }, { label: 'TOTAL COP', width: 42, align: 'right' }];
        tableHeader();
        const sources = new Map<string, { total: number; parties: Map<string, number> }>();
        matching.forEach(tx => {
          const entries = tx.transactionSources?.length ? tx.transactionSources.map(s => ({ name: s.source?.name || 'Sin fuente', amount: Number(s.amount) })) : [{ name: 'Sin fuente', amount: Number(tx.amount) }];
          entries.forEach(entry => {
            const source = sources.get(entry.name) || { total: 0, parties: new Map<string, number>() };
            source.total += entry.amount;
            const party = tx.thirdPartyName || 'Sin tercero';
            source.parties.set(party, (source.parties.get(party) || 0) + entry.amount);
            sources.set(entry.name, source);
          });
        });
        for (const [sourceName, source] of [...sources].sort((a, b) => b[1].total - a[1].total)) {
          row([{ text: sourceName, bold: true }, { text: money(source.total), color, bold: true }], colors.light, true);
          for (const [party, amount] of [...source.parties].sort((a, b) => b[1] - a[1])) {
            row([{ text: `    ${party}`, color: colors.muted }, { text: money(amount), color: colors.muted }]);
          }
        }
        row([{ text: `Subtotal ${label.toLowerCase()}`, bold: true, color }, { text: money(activity(matching)), bold: true, color }], colors.light);
        y += 5;
      }
      y += 5;
    }
    if (!categories.size) {
      ensure(15);
      write('El período contiene únicamente transferencias entre cuentas.', margin, y, 10, colors.muted);
      y += 10;
    }
  }

  if (transactions.length) {
    columns = [];
    continuation = '';
    ensure(28);
    y += 5;
    fill(margin, y, contentWidth, 19, colors.ink);
    write('BALANCE NETO DEL PERÍODO', margin + 5, y + 4, 9, colors.white, true);
    write('Ingresos menos gastos', margin + 5, y + 10, 8, '#C8D9E2');
    write(money(income - expense), width - margin - 5, y + 6, 16, colors.white, true, 'right');
  }
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    rule(height - 14);
    write(`Fenix Control · Generado el ${date(generatedAt)} · Documento informativo`, margin, height - 10, 8, colors.muted);
    write(`Página ${page} de ${pageCount}`, width - margin, height - 10, 8, colors.muted, false, 'right');
  }
  return pdf;
}
