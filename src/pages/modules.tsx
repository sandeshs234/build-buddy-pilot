import ModulePage from '@/components/ModulePage';
import { sampleInventory, sampleManpower, sampleEquipment, sampleSafety, sampleDelays, samplePOs } from '@/data/sampleData';

// ─── Inventory ───
export function InventoryPage() {
  return (
    <ModulePage
      title="Inventory"
      description="Track stock levels, receipts, and issues with reorder alerts"
      columns={[
        { key: 'code', label: 'Code', render: i => <span className="font-mono text-xs font-medium">{i.code}</span> },
        { key: 'description', label: 'Description', render: i => <span className="font-medium">{i.description}</span> },
        { key: 'unit', label: 'Unit' },
        { key: 'opening', label: 'Opening', render: i => <span className="text-right font-mono block">{i.opening}</span> },
        { key: 'receipts', label: 'Receipts', render: i => <span className="text-right font-mono block">{i.receipts}</span> },
        { key: 'issues', label: 'Issues', render: i => <span className="text-right font-mono block">{i.issues}</span> },
        { key: 'balance', label: 'Balance', render: i => (
          <span className={`text-right font-mono font-medium block ${i.balance <= i.minLevel ? 'text-destructive' : ''}`}>
            {i.balance}
          </span>
        )},
        { key: 'minLevel', label: 'Min Level', render: i => <span className="text-right font-mono block">{i.minLevel}</span> },
        { key: 'status', label: 'Status', render: i => (
          i.balance <= i.minLevel
            ? <span className="badge-critical">Low Stock</span>
            : <span className="badge-success">OK</span>
        )},
        { key: 'location', label: 'Location' },
      ]}
      data={sampleInventory}
    />
  );
}

// ─── Manpower ───
export function ManpowerPage() {
  return (
    <ModulePage
      title="Daily Manpower"
      description="Track skilled and unskilled labor by trade and location"
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'location', label: 'Location', render: i => <span className="font-medium">{i.location}</span> },
        { key: 'mason', label: 'Mason', render: i => <span className="text-center block font-mono">{i.mason}</span> },
        { key: 'carpenter', label: 'Carp.', render: i => <span className="text-center block font-mono">{i.carpenter}</span> },
        { key: 'steel', label: 'Steel', render: i => <span className="text-center block font-mono">{i.steel}</span> },
        { key: 'welder', label: 'Welder', render: i => <span className="text-center block font-mono">{i.welder}</span> },
        { key: 'operator', label: 'Opr.', render: i => <span className="text-center block font-mono">{i.operator}</span> },
        { key: 'skilled', label: 'Skilled', render: i => <span className="text-center block font-mono font-medium">{i.skilled}</span> },
        { key: 'unskilled', label: 'Unskilled', render: i => <span className="text-center block font-mono font-medium">{i.unskilled}</span> },
        { key: 'total', label: 'Total', render: i => <span className="text-center block font-mono font-bold">{i.skilled + i.unskilled}</span> },
        { key: 'supervisor', label: 'Supervisor' },
      ]}
      data={sampleManpower}
    />
  );
}

// ─── Equipment ───
export function EquipmentPage() {
  return (
    <ModulePage
      title="Equipment Log"
      description="Record equipment usage, hours, fuel consumption, and issues"
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'eqId', label: 'Eq. ID', render: i => <span className="font-mono text-xs font-medium">{i.eqId}</span> },
        { key: 'description', label: 'Equipment', render: i => <span className="font-medium">{i.description}</span> },
        { key: 'operator', label: 'Operator' },
        { key: 'hours', label: 'Hours', render: i => <span className="font-mono">{i.hours}</span> },
        { key: 'fuel', label: 'Fuel (L)', render: i => <span className="font-mono">{i.fuel}</span> },
        { key: 'activity', label: 'Activity' },
        { key: 'issues', label: 'Issues', render: i => i.issues ? <span className="badge-warning">{i.issues}</span> : <span className="text-muted-foreground">—</span> },
      ]}
      data={sampleEquipment}
    />
  );
}

// ─── Safety ───
export function SafetyPage() {
  return (
    <ModulePage
      title="Safety Incidents"
      description="Record incidents, near-misses, and safety observations"
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type', render: i => (
          i.type === 'incident' ? <span className="badge-critical">Incident</span> :
          i.type === 'near-miss' ? <span className="badge-warning">Near Miss</span> :
          <span className="badge-info">Observation</span>
        )},
        { key: 'location', label: 'Location' },
        { key: 'description', label: 'Description', render: i => <span className="font-medium">{i.description}</span> },
        { key: 'cause', label: 'Root Cause' },
        { key: 'preventive', label: 'Preventive Action' },
        { key: 'reporter', label: 'Reporter' },
      ]}
      data={sampleSafety}
    />
  );
}

// ─── Delays ───
export function DelaysPage() {
  return (
    <ModulePage
      title="Delays Register"
      description="Track delays, their causes, impact, and recovery actions"
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'activity', label: 'Activity', render: i => <span className="font-medium">{i.activity}</span> },
        { key: 'description', label: 'Description' },
        { key: 'cause', label: 'Cause' },
        { key: 'duration', label: 'Days', render: i => <span className="font-mono font-medium">{i.duration}</span> },
        { key: 'impact', label: 'Impact' },
        { key: 'recovery', label: 'Recovery Action' },
        { key: 'status', label: 'Status', render: i => (
          i.status === 'open' ? <span className="badge-critical">Open</span> :
          i.status === 'mitigated' ? <span className="badge-warning">Mitigated</span> :
          <span className="badge-success">Closed</span>
        )},
      ]}
      data={sampleDelays}
    />
  );
}

// ─── Purchase Orders ───
export function PurchaseOrdersPage() {
  return (
    <ModulePage
      title="Purchase Orders"
      description="Track purchase orders, suppliers, and delivery status"
      columns={[
        { key: 'poNo', label: 'PO No.', render: i => <span className="font-mono text-xs font-medium">{i.poNo}</span> },
        { key: 'date', label: 'Date' },
        { key: 'supplier', label: 'Supplier', render: i => <span className="font-medium">{i.supplier}</span> },
        { key: 'itemCode', label: 'Item Code', render: i => <span className="font-mono text-xs">{i.itemCode}</span> },
        { key: 'qty', label: 'Qty', render: i => <span className="font-mono">{i.qty}</span> },
        { key: 'price', label: 'Amount', render: i => <span className="font-mono font-medium">{i.price.toLocaleString()}</span> },
        { key: 'status', label: 'Status', render: i => (
          i.status === 'delivered' ? <span className="badge-success">Delivered</span> :
          i.status === 'issued' ? <span className="badge-info">Issued</span> :
          i.status === 'closed' ? <span className="badge-success">Closed</span> :
          <span className="text-xs text-muted-foreground">Draft</span>
        )},
        { key: 'remarks', label: 'Remarks' },
      ]}
      data={samplePOs}
    />
  );
}

// ─── Placeholder Modules ───
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="bg-card rounded-xl border shadow-sm p-12 text-center">
        <p className="text-muted-foreground">This module is ready for data entry. Start by adding your first record.</p>
      </div>
    </div>
  );
}

export const DailyQuantityPage = () => <PlaceholderPage title="Daily Quantity" description="Enter executed quantities per BOQ item with dynamic measurement fields" />;
export const BillsPage = () => <PlaceholderPage title="Bills" description="Record supplier bills with payment status tracking" />;
export const StaffPage = () => <PlaceholderPage title="Key Staff" description="Maintain list of project personnel – engineers, managers, accountants" />;
export const FuelLogPage = () => <PlaceholderPage title="Fuel Log" description="Track fuel receipts, issues, and running balance" />;
export const QualityPage = () => <PlaceholderPage title="Quality (ITP/NCR)" description="Log inspection test plans and non-conformance reports" />;
export const ConcreteLogPage = () => <PlaceholderPage title="Concrete Pour" description="Daily pour cards with slump, cubes, and weather data" />;
export const WeldingPage = () => <PlaceholderPage title="Welding Log" description="Daily welding reports with NDT results" />;
export const ToolsPage = () => <PlaceholderPage title="Tools" description="Tool issuance, return tracking, and condition reporting" />;
export const SubcontractorsPage = () => <PlaceholderPage title="Subcontractors" description="Track daily progress and cumulative completion for subcontractors" />;
export const PhotosPage = () => <PlaceholderPage title="Photos" description="Log photo records with location, description, and file references" />;
export const ChangeOrdersPage = () => <PlaceholderPage title="Change Orders" description="Track change requests with cost and schedule impact analysis" />;
export const DocumentsPage = () => <PlaceholderPage title="Documents" description="Upload and manage project documents with version control" />;
export const ReportsPage = () => <PlaceholderPage title="Reports" description="Generate printable reports for each module" />;
export const BackupPage = () => <PlaceholderPage title="Backup / Restore" description="Export and import project data as JSON backup files" />;
export const HelpPage = () => <PlaceholderPage title="User Manual" description="Built-in help and documentation for all modules" />;
export const SettingsPage = () => <PlaceholderPage title="Settings" description="Configure company details, project information, and system preferences" />;
