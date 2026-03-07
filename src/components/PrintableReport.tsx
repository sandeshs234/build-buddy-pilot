import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintableReportProps {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  projectName?: string;
}

export default function PrintableReport({ title, columns, data, projectName }: PrintableReportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const settings = JSON.parse(localStorage.getItem('buildforge-settings') || '{}');
    const logo = localStorage.getItem('buildforge-logo') || '';
    const stamp = localStorage.getItem('buildforge-stamp') || '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title} Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 20mm; font-size: 10pt; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 16px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-logo img { max-height: 50px; max-width: 120px; }
  .company-name { font-size: 14pt; font-weight: 700; color: #1a1a2e; }
  .company-detail { font-size: 8pt; color: #666; }
  .header-right { text-align: right; font-size: 8pt; color: #666; }
  .report-title { font-size: 14pt; font-weight: 700; text-align: center; margin: 12px 0; text-transform: uppercase; letter-spacing: 1px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 8pt; color: #555; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1a1a2e; color: #fff; font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; font-size: 9pt; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) { background: #f8f9fa; }
  .footer { margin-top: 24px; border-top: 2px solid #1a1a2e; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 8pt; color: #666; }
  .footer-stamp img { max-height: 60px; opacity: 0.7; }
  .signatures { display: flex; gap: 60px; margin-top: 40px; }
  .sig-block { text-align: center; }
  .sig-line { width: 140px; border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 8pt; color: #555; }
  .total-row { font-weight: 700; background: #e8edf2 !important; }
  @media print { body { padding: 10mm; } @page { size: A4 landscape; margin: 10mm; } }
</style></head><body>
  <div class="header">
    <div class="header-left">
      ${logo ? `<div class="header-logo"><img src="${logo}" /></div>` : ''}
      <div>
        <div class="company-name">${settings.companyName || 'BuildForge Engineering'}</div>
        <div class="company-detail">${settings.companyAddress || ''}</div>
        <div class="company-detail">${settings.companyPhone || ''} ${settings.companyEmail ? '| ' + settings.companyEmail : ''}</div>
      </div>
    </div>
    <div class="header-right">
      <div><strong>Project:</strong> ${settings.projectName || projectName || 'Construction Project'}</div>
      <div><strong>Client:</strong> ${settings.clientName || ''}</div>
      <div><strong>Contract No:</strong> ${settings.contractNo || ''}</div>
      <div><strong>Report Date:</strong> ${today}</div>
      <div><strong>Doc Ref:</strong> ${title.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}</div>
    </div>
  </div>
  <div class="report-title">${title} Report</div>
  <div class="meta-row">
    <span>Total Records: ${data.length}</span>
    <span>Printed: ${new Date().toLocaleString('en-GB')}</span>
  </div>
  <table>
    <thead><tr><th>#</th>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
    <tbody>${data.map((row, i) => `<tr><td>${i + 1}</td>${columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <div class="signatures">
    <div class="sig-block"><div class="sig-line">Prepared By</div></div>
    <div class="sig-block"><div class="sig-line">Checked By</div></div>
    <div class="sig-block"><div class="sig-line">Approved By</div></div>
  </div>
  <div class="footer">
    <div class="footer-left">
      <div>${settings.companyName || 'BuildForge Engineering'} — Confidential</div>
      <div>Page 1 of 1</div>
    </div>
    ${stamp ? `<div class="footer-stamp"><img src="${stamp}" /></div>` : ''}
  </div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  if (data.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer size={14} className="mr-1.5" /> Print Report
    </Button>
  );
}
