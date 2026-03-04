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
      ['2.1', 'Foundation – Piling', '2025-03-01', '2025-06-30', '', '', 0, 'Yes', '1.2', 'not-started'],
    ],
  },
  {
    name: 'BOQ / Items',
    fileName: 'Template_BOQ_Items',
    headers: ['Item Code', 'Description', 'Unit', 'Measure Type (direct/rectangular/trapezoidal/rebar)', 'Total Qty', 'Executed Qty', 'Unit Rate'],
    sampleRows: [
      ['EW-001', 'Bulk Excavation', 'm³', 'rectangular', 25000, 21250, 45],
      ['RC-001', 'Grade 40 Concrete', 'm³', 'direct', 3500, 2170, 850],
      ['RB-001', 'Rebar 16mm', 'ton', 'rebar', 450, 279, 4200],
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
    headers: ['Date', 'Location', 'Mason', 'Carpenter', 'Steel Fixer', 'Welder', 'Fitter', 'Electrician', 'Operator', 'Skilled Total', 'Unskilled Total', 'Supervisor'],
    sampleRows: [
      ['2025-03-03', 'Zone A – Piling', 0, 4, 8, 2, 3, 0, 4, 21, 35, 'Ahmad K.'],
      ['2025-03-03', 'Zone B – Excavation', 0, 0, 0, 0, 0, 0, 6, 6, 45, 'Ravi M.'],
    ],
  },
  {
    name: 'Equipment Log',
    fileName: 'Template_Equipment',
    headers: ['Date', 'Eq. ID', 'Equipment', 'Operator', 'Hours', 'Fuel (L)', 'Activity', 'Issues'],
    sampleRows: [
      ['2025-03-03', 'EQ-001', 'CAT 320 Excavator', 'Singh R.', 9.5, 180, 'Excavation Zone B', ''],
      ['2025-03-03', 'EQ-002', 'Liebherr Piling Rig', 'Ahmed F.', 8, 250, 'Piling Zone A', ''],
    ],
  },
  {
    name: 'Purchase Orders',
    fileName: 'Template_PurchaseOrders',
    headers: ['PO No.', 'Date', 'Supplier', 'Item Code', 'Qty', 'Amount', 'Status (draft/issued/delivered/closed)', 'Remarks'],
    sampleRows: [
      ['PO-2025-001', '2025-01-20', 'Gulf Ready Mix', 'RC-001', 500, 425000, 'delivered', 'Grade 40, 150mm slump'],
      ['PO-2025-002', '2025-02-05', 'National Steel Co.', 'RB-001', 150, 630000, 'issued', '16mm Y-bar'],
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
];

function downloadTemplate(template: Template) {
  const wsData = [template.headers, ...template.sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  // Auto-size columns
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
        <p className="text-sm text-muted-foreground">Download pre-formatted templates showing the expected columns and sample data for each module.</p>

        <div className="space-y-3 mt-2">
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
