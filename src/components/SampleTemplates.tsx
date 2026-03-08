import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileSpreadsheet } from 'lucide-react';

interface Template {
  name: string;
  fileName: string;
  headers: string[];
  sampleRows: any[][];
}

const templates: Template[] = [
  {
    name: 'Activities (CPM)',
    fileName: 'Template_Activities_CPM',
    headers: ['WBS', 'Activity Name', 'Planned Start', 'Planned End', 'Actual Start', 'Actual End', 'Progress %', 'Critical (Yes/No)', 'Predecessors', 'Status'],
    sampleRows: [
      ['1.1', 'Site Mobilization', '2025-01-15', '2025-02-15', '2025-01-15', '2025-02-10', 100, 'Yes', '', 'completed'],
      ['1.2', 'Excavation & Earthworks', '2025-02-16', '2025-04-30', '2025-02-16', '', 65, 'Yes', '1.1', 'in-progress'],
    ],
  },
  {
    name: 'BOQ / Items',
    fileName: 'Template_BOQ_Items',
    headers: ['Item Code', 'Description', 'Unit', 'Measure Type (direct/rectangular/trapezoidal/rebar)', 'Total Qty', 'Executed Qty', 'Unit Rate'],
    sampleRows: [
      ['EW-001', 'Bulk Excavation', 'm³', 'rectangular', 25000, 21250, 45],
      ['RC-001', 'Grade 40 Concrete', 'm³', 'direct', 3500, 2170, 850],
    ],
  },
  {
    name: 'Inventory',
    fileName: 'Template_Inventory',
    headers: ['Code', 'Description', 'Unit', 'Opening', 'Receipts', 'Issues', 'Balance', 'Min Level', 'Location'],
    sampleRows: [
      ['MAT-001', 'Portland Cement OPC 42.5', 'bag', 500, 2000, 1800, 700, 200, 'Warehouse A'],
      ['MAT-002', 'Fine Aggregate (Sand)', 'ton', 150, 400, 380, 170, 50, 'Stockyard'],
    ],
  },
  {
    name: 'Daily Manpower',
    fileName: 'Template_Manpower',
    headers: ['Date', 'Location', 'Mason', 'Carpenter', 'Steel Fixer / Rebar', 'Welder', 'Pipe Fitter', 'Electrician', 'Plumber', 'Crane Operator', 'Skilled Labour', 'Unskilled Labour / Helper', 'Supervisor'],
    sampleRows: [
      ['2025-03-03', 'Zone A – Piling', 0, 4, 8, 2, 3, 0, 0, 4, 5, 35, 'Ahmad K.'],
    ],
  },
  {
    name: 'Equipment Log',
    fileName: 'Template_Equipment',
    headers: ['Date', 'Eq. ID', 'Equipment', 'Operator', 'Ownership (owned/leased/rented)', 'Billing (hourly/daily/monthly)', 'Rate', 'Hours', 'Fuel (L)', 'Activity', 'Issues'],
    sampleRows: [
      ['2025-03-03', 'EQ-001', 'Excavator', 'Singh R.', 'owned', 'hourly', 250, 9.5, 180, 'Excavation Zone B', ''],
      ['2025-03-03', 'EQ-002', 'Piling Rig (CFA)', 'Ahmed F.', 'leased', 'daily', 8500, 8, 250, 'Piling Zone A', ''],
    ],
  },
  {
    name: 'Fuel Log',
    fileName: 'Template_FuelLog',
    headers: ['Date', 'Fuel Type (diesel/petrol/lpg)', 'Receipt (L)', 'Issued (L)', 'Issued To (Equipment)', 'Balance', 'Remarks'],
    sampleRows: [
      ['2025-03-03', 'diesel', 2000, 0, '', 7500, 'Tanker delivery'],
      ['2025-03-03', 'diesel', 0, 180, 'EQ-001 - Excavator', 7320, 'Issued to excavator'],
    ],
  },
  {
    name: 'Concrete Pour',
    fileName: 'Template_ConcretePour',
    headers: ['Date', 'Location', 'Concrete Grade', 'Supplier', 'Volume (m³)', 'Slump (mm)', 'Temp (°C)', 'Weather', 'Test Cubes', 'Pour Method', 'Structural Element', 'Supervisor'],
    sampleRows: [
      ['2025-03-03', 'Zone A - Pile Cap PC-01', 'C40 (M40)', 'Gulf Ready Mix', 85, 150, 28, 'sunny', 6, 'pump', 'Pile Cap', 'Ahmad K.'],
    ],
  },
  {
    name: 'Purchase Orders',
    fileName: 'Template_PurchaseOrders',
    headers: ['PO No.', 'Date', 'Supplier', 'Item Code', 'Qty', 'Amount', 'Status (draft/issued/delivered/closed)', 'Remarks'],
    sampleRows: [
      ['PO-2025-001', '2025-01-20', 'Gulf Ready Mix', 'RC-001', 500, 425000, 'delivered', 'Grade 40, 150mm slump'],
    ],
  },
  {
    name: 'Safety Incidents',
    fileName: 'Template_Safety',
    headers: ['Date', 'Type (incident/near-miss/observation)', 'Location', 'Description', 'Injured', 'Root Cause', 'Preventive Action', 'Reporter'],
    sampleRows: [
      ['2025-03-01', 'near-miss', 'Zone A', 'Unsecured load on crane', '', 'Improper rigging', 'Re-train riggers', 'Safety Officer'],
    ],
  },
  {
    name: 'Delays Register',
    fileName: 'Template_Delays',
    headers: ['Date', 'Activity', 'Description', 'Cause', 'Duration (Days)', 'Impact', 'Recovery Action', 'Status (open/mitigated/closed)'],
    sampleRows: [
      ['2025-02-20', 'Piling Works', 'Rig breakdown', 'Mechanical', 3, 'Critical path delayed', 'Mobilized standby rig', 'mitigated'],
    ],
  },
  {
    name: 'Daily Quantity',
    fileName: 'Template_DailyQuantity',
    headers: ['Date', 'BOQ Code', 'Description', 'Quantity', 'Unit', 'Location', 'Remarks'],
    sampleRows: [
      ['2025-03-03', 'EW-001', 'Bulk Excavation', 450, 'm³', 'Zone B', 'Level -3 to -2'],
      ['2025-03-03', 'RC-001', 'Grade 40 Concrete', 85, 'm³', 'Zone A', 'Pile cap PC-01'],
    ],
  },
  {
    name: 'Bills',
    fileName: 'Template_Bills',
    headers: ['Bill No.', 'Date', 'Supplier', 'PO Ref', 'Amount', 'Status (pending/approved/paid/rejected)', 'Remarks'],
    sampleRows: [
      ['INV-001', '2025-02-28', 'Gulf Ready Mix', 'PO-2025-001', 212500, 'approved', 'Partial delivery'],
    ],
  },
  {
    name: 'Key Staff',
    fileName: 'Template_Staff',
    headers: ['Name', 'Role', 'Contact', 'Department', 'Responsibility', 'Join Date'],
    sampleRows: [
      ['Ahmad Khan', 'Project Manager', '+971-50-123-4567', 'Management', 'Overall project delivery', '2025-01-01'],
    ],
  },
  {
    name: 'Quality (ITP/NCR)',
    fileName: 'Template_Quality',
    headers: ['Test ID', 'Date', 'Location', 'Type (ITP/NCR/MIR)', 'Specification', 'Result (pass/fail/pending)', 'Status (open/closed)', 'Tested By'],
    sampleRows: [
      ['ITP-001', '2025-03-01', 'Zone A', 'ITP', 'BS EN 12390-3', 'pass', 'closed', 'Lab Technician'],
    ],
  },
  {
    name: 'Welding Log',
    fileName: 'Template_Welding',
    headers: ['Date', 'Location', 'Welder', 'Welder ID', 'Joint Type', 'No. Joints', 'NDT Required (yes/no)', 'NDT Result (pass/fail/pending)', 'Inspector'],
    sampleRows: [
      ['2025-03-03', 'Zone A - Steel Structure', 'Karim M.', 'WLD-005', 'Butt Weld', 12, 'yes', 'pass', 'QC Inspector'],
    ],
  },
  {
    name: 'Tools',
    fileName: 'Template_Tools',
    headers: ['Tool ID', 'Description', 'Issued To', 'Date Issued', 'Expected Return', 'Actual Return', 'Condition (good/fair/poor/damaged)'],
    sampleRows: [
      ['TL-001', 'Total Station Leica TS16', 'Survey Team', '2025-03-01', '2025-03-15', '', 'good'],
    ],
  },
  {
    name: 'Subcontractors',
    fileName: 'Template_Subcontractors',
    headers: ['Name', 'Scope', 'Contract Value', 'Date', 'Manpower', 'Daily Progress', 'Cumulative %', 'Supervisor'],
    sampleRows: [
      ['Al-Habtoor Piling', 'CFA Piling Works', 12500000, '2025-03-03', 25, '3 piles completed', 42, 'Site Engineer'],
    ],
  },
  {
    name: 'Change Orders',
    fileName: 'Template_ChangeOrders',
    headers: ['CO No.', 'Date', 'Description', 'Cost Impact', 'Schedule Impact', 'Status (pending/approved/rejected)', 'Approved Date'],
    sampleRows: [
      ['CO-001', '2025-02-15', 'Additional piling due to soil condition', 850000, '15 days extension', 'approved', '2025-02-28'],
    ],
  },
];

function downloadTemplate(template: Template) {
  const wsData = [template.headers, ...template.sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = template.headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, `${template.fileName}.xlsx`);
}

interface SampleTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SampleTemplates({ open, onOpenChange }: SampleTemplatesProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={20} />
            Sample Excel Templates
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Download pre-formatted templates for every module.</p>

        <div className="space-y-2 mt-2">
          {templates.map(t => (
            <div key={t.fileName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.headers.length} columns · {t.sampleRows.length} sample rows</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate(t)}>
                <Download size={14} className="mr-1.5" /> Download
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs font-medium text-primary mb-1">Import Instructions</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-4">
            <li>Download the template for the module you need</li>
            <li>Fill in your data following the sample format</li>
            <li>Keep the header row exactly as shown</li>
            <li>Go to the relevant module tab and click "Import XLS"</li>
            <li>Dates should be in YYYY-MM-DD format</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
