import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { esc } from '@/lib/htmlEscape';

interface PrintableReportProps {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
  projectName?: string;
}

export default function PrintableReport({ title, columns, data, projectName }: PrintableReportProps) {
  const handlePrint = () => {
    const settings = JSON.parse(localStorage.getItem('buildforge-settings') || '{}');
    const logo = localStorage.getItem('buildforge-logo') || '';
    const stamp = localStorage.getItem('buildforge-stamp') || '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const docRef = `${title.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title} Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 12mm 15mm; font-size: 9pt; }
  
  /* ── HEADER: Bold centered letterhead ── */
  .header { text-align: center; padding-bottom: 10px; margin-bottom: 8px; }
  .header-logo { margin-bottom: 6px; }
  .header-logo img { max-height: 60px; max-width: 160px; }
  .company-name { font-size: 20pt; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; line-height: 1.2; }
  .company-tagline { font-size: 9pt; font-weight: 600; color: #444; letter-spacing: 1px; margin-top: 2px; }
  .company-contact { font-size: 7.5pt; color: #666; margin-top: 4px; letter-spacing: 0.3px; }
  .header-line { height: 2px; background: linear-gradient(90deg, transparent, #1a1a2e, transparent); margin: 8px 0; }
  
  /* ── PROJECT INFO ROW ── */
  .project-info { display: flex; justify-content: space-between; font-size: 8pt; color: #444; margin-bottom: 6px; padding: 6px 0; }
  .project-info .left, .project-info .right { display: flex; flex-direction: column; gap: 2px; }
  .project-info .right { text-align: right; }
  .project-info strong { color: #1a1a2e; font-weight: 700; }
  
  /* ── REPORT TITLE ── */
  .report-title { font-size: 13pt; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; margin: 6px 0 4px; }
  .report-subtitle { text-align: center; font-size: 8pt; color: #666; margin-bottom: 8px; }
  
  /* ── TABLE: Clean, no heavy borders ── */
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #1a1a2e; color: #fff; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 6px; text-align: left; }
  th:first-child { border-radius: 3px 0 0 0; }
  th:last-child { border-radius: 0 3px 0 0; }
  td { padding: 4px 6px; font-size: 8pt; border-bottom: 0.5px solid #e8e8e8; }
  tr:nth-child(even) { background: #f9fafb; }
  tr:hover { background: #f0f4ff; }
  
  /* ── SUMMARY ROW ── */
  .summary-row { margin-top: 8px; font-size: 8pt; color: #555; display: flex; justify-content: space-between; }
  
  /* ── SIGNATURES: Clean blocks ── */
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
  .sig-block { text-align: center; min-width: 120px; }
  .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 4px; font-size: 7.5pt; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.5px; }
  .sig-role { font-size: 7pt; color: #888; margin-top: 1px; }
  
  /* ── FOOTER ── */
  .footer { margin-top: 20px; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 7pt; color: #888; }
  .footer-left div { margin-bottom: 1px; }
  .footer-stamp img { max-height: 55px; opacity: 0.6; }
  
  @media print {
    body { padding: 8mm 12mm; }
    @page { size: A4 landscape; margin: 8mm; }
    tr:hover { background: inherit; }
  }
</style></head><body>
  <div class="header">
     ${logo ? `<div class="header-logo"><img src="${esc(logo)}" /></div>` : ''}
    <div class="company-name">${esc(settings.companyName || 'BuildForge Engineering')}</div>
    <div class="company-tagline">${esc(settings.companyTagline || 'Construction Project Management')}</div>
    <div class="company-contact">${[settings.companyAddress, settings.companyPhone, settings.companyEmail].filter(Boolean).map(esc).join('  ·  ')}</div>
    <div class="header-line"></div>
  </div>
  
  <div class="project-info">
    <div class="left">
       <div><strong>Project:</strong> ${esc(settings.projectName || projectName || 'Construction Project')}</div>
      <div><strong>Client:</strong> ${esc(settings.clientName || '—')}</div>
      <div><strong>Contractor:</strong> ${esc(settings.contractorName || settings.companyName || '—')}</div>
    </div>
    <div class="right">
      <div><strong>Contract No:</strong> ${esc(settings.contractNo || '—')}</div>
      <div><strong>Report Date:</strong> ${esc(today)}</div>
      <div><strong>Doc Ref:</strong> ${esc(docRef)}</div>
    </div>
  </div>
  
  <div class="report-title">${title}</div>
  <div class="report-subtitle">Total Records: ${data.length} · Generated: ${new Date().toLocaleString('en-GB')}</div>
  
  <table>
    <thead><tr><th style="width:30px">#</th>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
    <tbody>${data.map((row, i) => `<tr><td style="text-align:center;color:#888;font-size:7pt">${i + 1}</td>${columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  
  <div class="summary-row">
    <span>End of Report — ${data.length} record(s)</span>
    <span>${settings.companyName || 'BuildForge Engineering'}</span>
  </div>
  
  <div class="signatures">
    <div class="sig-block"><div class="sig-line">Prepared By</div><div class="sig-role">Name / Date / Signature</div></div>
    <div class="sig-block"><div class="sig-line">Checked By</div><div class="sig-role">Name / Date / Signature</div></div>
    <div class="sig-block"><div class="sig-line">Approved By</div><div class="sig-role">Name / Date / Signature</div></div>
  </div>
  
  <div class="footer">
    <div class="footer-left">
      <div>${settings.companyName || 'BuildForge Engineering'} — Confidential</div>
      <div>Page 1 of 1 · ${docRef}</div>
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
