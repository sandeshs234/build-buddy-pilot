import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, TrendingUp, Users, AlertTriangle, Package, ShoppingCart, Clock, CheckCircle2, CalendarClock } from 'lucide-react';
import { useProjectData } from '@/context/ProjectDataContext';
import { projectInfo } from '@/data/sampleData';
import { supabase } from '@/integrations/supabase/client';

interface ProcItem {
  material_description: string;
  status: string;
  expected_delivery: string;
  actual_delivery: string;
  total_cost: number;
  supplier: string;
  po_number: string;
  ordered_qty: number;
  received_qty: number;
  unit: string;
}

export default function ProjectSummaryReport() {
  const { activities, boqItems, manpower, delays, equipment, purchaseOrders } = useProjectData();
  const [procItems, setProcItems] = useState<ProcItem[]>([]);

  useEffect(() => {
    supabase.from('procurement_tracking')
      .select('material_description,status,expected_delivery,actual_delivery,total_cost,supplier,po_number,ordered_qty,received_qty,unit')
      .then(({ data }) => setProcItems((data as ProcItem[]) || []));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const inProgressCount = activities.filter(a => a.status === 'in-progress').length;
  const criticalActive = activities.filter(a => a.critical && a.status !== 'completed');
  const overallProgress = activities.length > 0
    ? Math.round(activities.reduce((s, a) => s + a.percentComplete, 0) / activities.length)
    : 0;
  const totalBudget = boqItems.reduce((s, i) => s + i.totalQty * i.rate, 0);
  const executedValue = boqItems.reduce((s, i) => s + i.executedQty * i.rate, 0);
  const openDelays = delays.filter(d => d.status === 'open').length;
  const totalManpower = manpower.reduce((s, m) => {
    const trades = (m as any).trades || [];
    return s + trades.reduce((ts: number, t: any) => ts + (t.count || 0), 0);
  }, 0);

  const overdueProcItems = procItems.filter(p => p.expected_delivery && p.expected_delivery < today && p.status !== 'received' && !p.actual_delivery);
  const totalPOValue = purchaseOrders.reduce((s, po) => s + (po.price || 0), 0);
  const deliveredPO = purchaseOrders.filter(po => po.status === 'delivered').length;

  const handlePrint = () => {
    const settings = JSON.parse(localStorage.getItem('buildforge-settings') || '{}');
    const logo = localStorage.getItem('buildforge-logo') || '';
    const stamp = localStorage.getItem('buildforge-stamp') || '';
    const pw = window.open('', '_blank');
    if (!pw) return;

    const todayFmt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const docRef = `PROJ-SUMMARY-${Date.now().toString(36).toUpperCase()}`;

    const criticalRows = criticalActive.map((a, i) => `
      <tr><td style="text-align:center;color:#888;font-size:7pt">${i + 1}</td>
      <td class="mono">${a.wbs}</td><td>${a.name}</td><td>${a.plannedEnd}</td>
      <td><div style="background:#e8e8e8;border-radius:3px;height:6px;width:80px"><div style="background:#e67e22;height:6px;border-radius:3px;width:${a.percentComplete}%"></div></div> ${a.percentComplete}%</td>
      <td><span style="color:#e74c3c;font-weight:700;font-size:7pt">CRITICAL</span></td></tr>`).join('');

    const overdueRows = overdueProcItems.map((p, i) => {
      const days = Math.ceil((new Date().getTime() - new Date(p.expected_delivery).getTime()) / 86400000);
      return `<tr><td style="text-align:center;color:#888;font-size:7pt">${i + 1}</td>
      <td>${p.material_description}</td><td>${p.supplier}</td><td>${p.po_number}</td>
      <td>${p.expected_delivery}</td><td style="color:#e74c3c;font-weight:700">${days}d</td></tr>`;
    }).join('');

    const boqTop = [...boqItems].sort((a, b) => (b.executedQty * b.rate) - (a.executedQty * a.rate)).slice(0, 8);
    const boqRows = boqTop.map((b, i) => {
      const pct = b.totalQty > 0 ? Math.round((b.executedQty / b.totalQty) * 100) : 0;
      return `<tr><td style="text-align:center;color:#888;font-size:7pt">${i + 1}</td>
      <td class="mono">${b.code}</td><td>${b.description}</td><td>${b.unit}</td>
      <td style="text-align:right">${b.totalQty.toLocaleString()}</td>
      <td style="text-align:right">${b.executedQty.toLocaleString()}</td>
      <td>${pct}%</td></tr>`;
    }).join('');

    pw.document.write(`<!DOCTYPE html><html><head><title>Project Summary Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1a1a2e;padding:10mm 15mm;font-size:9pt}
  .header{text-align:center;padding-bottom:8px;margin-bottom:6px}
  .header-logo img{max-height:55px;max-width:150px;margin-bottom:4px}
  .company-name{font-size:18pt;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#1a1a2e}
  .company-tagline{font-size:8pt;font-weight:600;color:#444;letter-spacing:1px;margin-top:2px}
  .company-contact{font-size:7pt;color:#666;margin-top:3px}
  .header-line{height:2px;background:linear-gradient(90deg,transparent,#1a1a2e,transparent);margin:6px 0}
  .project-info{display:flex;justify-content:space-between;font-size:8pt;color:#444;margin-bottom:4px;padding:4px 0}
  .project-info strong{color:#1a1a2e;font-weight:700}
  .project-info .left,.project-info .right{display:flex;flex-direction:column;gap:2px}
  .project-info .right{text-align:right}
  .report-title{font-size:14pt;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:2px;color:#1a1a2e;margin:4px 0 2px}
  .report-subtitle{text-align:center;font-size:7.5pt;color:#666;margin-bottom:8px}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
  .kpi{border:1px solid #e0e0e0;border-radius:6px;padding:8px 10px;text-align:center}
  .kpi-value{font-size:16pt;font-weight:800;color:#1a1a2e}
  .kpi-label{font-size:7pt;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px}
  .kpi-sub{font-size:6.5pt;color:#999;margin-top:1px}
  .section-title{font-size:10pt;font-weight:700;color:#1a1a2e;margin:10px 0 4px;padding-bottom:3px;border-bottom:1.5px solid #1a1a2e;text-transform:uppercase;letter-spacing:1px}
  table{width:100%;border-collapse:collapse;margin-top:3px;margin-bottom:8px}
  th{background:#1a1a2e;color:#fff;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;padding:4px 5px;text-align:left}
  th:first-child{border-radius:3px 0 0 0}th:last-child{border-radius:0 3px 0 0}
  td{padding:3px 5px;font-size:7.5pt;border-bottom:0.5px solid #e8e8e8}
  tr:nth-child(even){background:#f9fafb}
  .mono{font-family:'Courier New',monospace;font-size:7pt}
  .budget-bar{display:flex;align-items:center;gap:8px;margin:6px 0 10px}
  .budget-track{flex:1;height:10px;background:#e8e8e8;border-radius:5px;overflow:hidden}
  .budget-fill{height:100%;background:linear-gradient(90deg,#27ae60,#e67e22);border-radius:5px}
  .budget-labels{display:flex;justify-content:space-between;font-size:7pt;color:#666}
  .summary-row{margin-top:6px;font-size:7.5pt;color:#555;display:flex;justify-content:space-between}
  .signatures{display:flex;justify-content:space-between;margin-top:30px;padding:0 15px}
  .sig-block{text-align:center;min-width:110px}
  .sig-line{border-top:1px solid #333;margin-top:40px;padding-top:3px;font-size:7pt;font-weight:600;color:#444;text-transform:uppercase}
  .sig-role{font-size:6.5pt;color:#888;margin-top:1px}
  .footer{margin-top:15px;padding-top:6px;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-left{font-size:6.5pt;color:#888}
  .footer-left div{margin-bottom:1px}
  .footer-stamp img{max-height:50px;opacity:0.6}
  .highlight{color:#e74c3c;font-weight:700}
  .good{color:#27ae60;font-weight:700}
  @media print{body{padding:8mm 12mm}@page{size:A4 landscape;margin:8mm}}
</style></head><body>
  <div class="header">
    ${logo ? `<div class="header-logo"><img src="${logo}" /></div>` : ''}
    <div class="company-name">${settings.companyName || 'BuildForge Engineering'}</div>
    <div class="company-tagline">${settings.companyTagline || 'Construction Project Management'}</div>
    <div class="company-contact">${[settings.companyAddress, settings.companyPhone, settings.companyEmail].filter(Boolean).join('  ·  ')}</div>
    <div class="header-line"></div>
  </div>

  <div class="project-info">
    <div class="left">
      <div><strong>Project:</strong> ${settings.projectName || projectInfo.name}</div>
      <div><strong>Client:</strong> ${settings.clientName || projectInfo.client}</div>
      <div><strong>Contractor:</strong> ${settings.contractorName || settings.companyName || projectInfo.contractor}</div>
    </div>
    <div class="right">
      <div><strong>Contract No:</strong> ${settings.contractNo || '—'}</div>
      <div><strong>Report Date:</strong> ${todayFmt}</div>
      <div><strong>Doc Ref:</strong> ${docRef}</div>
    </div>
  </div>

  <div class="report-title">Project Executive Summary</div>
  <div class="report-subtitle">Comprehensive Status Report · Generated ${new Date().toLocaleString('en-GB')}</div>

  <!-- KPI Dashboard -->
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-value">${overallProgress}%</div><div class="kpi-label">Overall Progress</div><div class="kpi-sub">${completedCount}/${activities.length} activities done</div></div>
    <div class="kpi"><div class="kpi-value ${openDelays > 0 ? 'highlight' : ''}">${openDelays}</div><div class="kpi-label">Open Delays</div><div class="kpi-sub">${delays.length} total recorded</div></div>
    <div class="kpi"><div class="kpi-value">${criticalActive.length}</div><div class="kpi-label">Critical Activities</div><div class="kpi-sub">Remaining on critical path</div></div>
    <div class="kpi"><div class="kpi-value ${overdueProcItems.length > 0 ? 'highlight' : 'good'}">${overdueProcItems.length}</div><div class="kpi-label">Overdue Deliveries</div><div class="kpi-sub">Procurement items past due</div></div>
  </div>

  <!-- Budget Overview -->
  <div class="section-title">Budget Overview</div>
  <div class="budget-labels"><span>Executed: ${projectInfo.currency} ${(executedValue / 1e6).toFixed(2)}M</span><span>Total Budget: ${projectInfo.currency} ${(totalBudget / 1e6).toFixed(2)}M</span></div>
  <div class="budget-bar"><div class="budget-track"><div class="budget-fill" style="width:${totalBudget > 0 ? Math.round((executedValue / totalBudget) * 100) : 0}%"></div></div><span style="font-size:8pt;font-weight:700">${totalBudget > 0 ? Math.round((executedValue / totalBudget) * 100) : 0}%</span></div>
  <div style="display:flex;gap:20px;font-size:7.5pt;color:#444;margin-bottom:8px">
    <div><strong>Contract Value:</strong> ${projectInfo.currency} ${(projectInfo.contractValue / 1e6).toFixed(0)}M</div>
    <div><strong>Total PO Value:</strong> ${projectInfo.currency} ${totalPOValue.toLocaleString()}</div>
    <div><strong>PO Fulfillment:</strong> ${purchaseOrders.length > 0 ? Math.round((deliveredPO / purchaseOrders.length) * 100) : 0}%</div>
    <div><strong>Manpower Today:</strong> ${totalManpower}</div>
  </div>

  <!-- Top BOQ Items -->
  <div class="section-title">Top BOQ Items by Value</div>
  <table><thead><tr><th style="width:25px">#</th><th>Code</th><th>Description</th><th>Unit</th><th style="text-align:right">Total Qty</th><th style="text-align:right">Executed</th><th>Progress</th></tr></thead>
  <tbody>${boqRows || '<tr><td colspan="7" style="text-align:center;color:#999">No BOQ data</td></tr>'}</tbody></table>

  <!-- Critical Activities -->
  <div class="section-title">Active Critical Path Activities</div>
  <table><thead><tr><th style="width:25px">#</th><th>WBS</th><th>Activity</th><th>Planned End</th><th>Progress</th><th>Status</th></tr></thead>
  <tbody>${criticalRows || '<tr><td colspan="6" style="text-align:center;color:#999">No active critical activities</td></tr>'}</tbody></table>

  <!-- Overdue Procurement -->
  <div class="section-title">Overdue Procurement Items</div>
  <table><thead><tr><th style="width:25px">#</th><th>Material</th><th>Supplier</th><th>PO No.</th><th>Expected</th><th>Overdue</th></tr></thead>
  <tbody>${overdueRows || '<tr><td colspan="6" style="text-align:center;color:#27ae60">No overdue items — all deliveries on track</td></tr>'}</tbody></table>

  <div class="summary-row">
    <span>End of Executive Summary · ${todayFmt}</span>
    <span>${settings.companyName || 'BuildForge Engineering'}</span>
  </div>

  <div class="signatures">
    <div class="sig-block"><div class="sig-line">Prepared By</div><div class="sig-role">Project Engineer / Date</div></div>
    <div class="sig-block"><div class="sig-line">Reviewed By</div><div class="sig-role">Project Manager / Date</div></div>
    <div class="sig-block"><div class="sig-line">Approved By</div><div class="sig-role">Project Director / Date</div></div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div>${settings.companyName || 'BuildForge Engineering'} — Confidential</div>
      <div>Page 1 of 1 · ${docRef}</div>
    </div>
    ${stamp ? `<div class="footer-stamp"><img src="${stamp}" /></div>` : ''}
  </div>
</body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 300);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Project Summary Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Comprehensive executive summary with KPIs, budget, procurement & critical path</p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer size={16} /> Print / PDF
        </Button>
      </div>

      {/* KPI Preview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-1 text-primary" size={20} />
            <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto mb-1 text-destructive" size={20} />
            <p className="text-2xl font-bold text-foreground">{criticalActive.length}</p>
            <p className="text-xs text-muted-foreground">Critical Activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-1 text-destructive" size={20} />
            <p className={`text-2xl font-bold ${overdueProcItems.length > 0 ? 'text-destructive' : 'text-foreground'}`}>{overdueProcItems.length}</p>
            <p className="text-xs text-muted-foreground">Overdue Deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="mx-auto mb-1 text-emerald-500" size={20} />
            <p className="text-2xl font-bold text-foreground">{deliveredPO}/{purchaseOrders.length}</p>
            <p className="text-xs text-muted-foreground">PO Fulfillment</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Bar */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Budget Execution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Executed: {projectInfo.currency} {(executedValue / 1e6).toFixed(2)}M</span>
            <span>Budget: {projectInfo.currency} {(totalBudget / 1e6).toFixed(2)}M</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalBudget > 0 ? Math.round((executedValue / totalBudget) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right font-semibold">{totalBudget > 0 ? Math.round((executedValue / totalBudget) * 100) : 0}% executed</p>
        </CardContent>
      </Card>

      {/* Critical Activities Table */}
      {criticalActive.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-destructive" /> Active Critical Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>WBS</th><th>Activity</th><th>Planned End</th><th>Progress</th></tr></thead>
                <tbody>
                  {criticalActive.map(a => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs">{a.wbs}</td>
                      <td>{a.name}</td>
                      <td>{a.plannedEnd}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${a.percentComplete}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{a.percentComplete}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Procurement */}
      {overdueProcItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive"><Package size={14} /> Overdue Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueProcItems.map((p, i) => {
                const days = Math.ceil((new Date().getTime() - new Date(p.expected_delivery).getTime()) / 86400000);
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <span className="text-sm font-medium">{p.material_description}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.supplier})</span>
                    </div>
                    <Badge variant="destructive">{days}d overdue</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">Click "Print / PDF" to generate a professional A4 executive summary document.</p>
    </div>
  );
}
