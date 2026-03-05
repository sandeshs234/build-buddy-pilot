import { Activity, BOQItem, InventoryItem, ManpowerEntry, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';

export const sampleActivities: Activity[] = [
  { id: '1', wbs: '1.1', name: 'Site Mobilization', plannedStart: '2025-01-15', plannedEnd: '2025-02-15', actualStart: '2025-01-15', actualEnd: '2025-02-10', percentComplete: 100, critical: true, status: 'completed' },
  { id: '2', wbs: '1.2', name: 'Excavation & Earthworks', plannedStart: '2025-02-16', plannedEnd: '2025-04-30', actualStart: '2025-02-11', percentComplete: 85, critical: true, status: 'in-progress' },
  { id: '3', wbs: '2.1', name: 'Foundation – Piling Works', plannedStart: '2025-03-01', plannedEnd: '2025-06-30', actualStart: '2025-03-05', percentComplete: 62, critical: true, status: 'in-progress', predecessors: '1.2' },
  { id: '4', wbs: '2.2', name: 'Foundation – Pile Caps', plannedStart: '2025-05-01', plannedEnd: '2025-07-31', percentComplete: 15, critical: false, status: 'in-progress', predecessors: '2.1' },
  { id: '5', wbs: '3.1', name: 'Substructure Concrete', plannedStart: '2025-06-01', plannedEnd: '2025-09-30', percentComplete: 0, critical: true, status: 'not-started', predecessors: '2.2' },
  { id: '6', wbs: '3.2', name: 'Waterproofing', plannedStart: '2025-07-01', plannedEnd: '2025-08-31', percentComplete: 0, critical: false, status: 'not-started' },
  { id: '7', wbs: '4.1', name: 'Superstructure – Columns L1–L5', plannedStart: '2025-08-01', plannedEnd: '2025-12-31', percentComplete: 0, critical: true, status: 'not-started', predecessors: '3.1' },
  { id: '8', wbs: '4.2', name: 'Superstructure – Slabs L1–L5', plannedStart: '2025-09-01', plannedEnd: '2026-02-28', percentComplete: 0, critical: true, status: 'not-started', predecessors: '4.1' },
  { id: '9', wbs: '5.1', name: 'MEP Rough-in', plannedStart: '2025-10-01', plannedEnd: '2026-03-31', percentComplete: 0, critical: false, status: 'not-started' },
  { id: '10', wbs: '6.1', name: 'Façade Installation', plannedStart: '2026-01-01', plannedEnd: '2026-06-30', percentComplete: 0, critical: false, status: 'not-started' },
];

export const sampleBOQ: BOQItem[] = [
  { id: '1', code: 'EW-001', description: 'Bulk Excavation', unit: 'm³', measureType: 'rectangular', totalQty: 25000, executedQty: 21250, rate: 45 },
  { id: '2', code: 'EW-002', description: 'Backfill & Compaction', unit: 'm³', measureType: 'rectangular', totalQty: 8000, executedQty: 4800, rate: 35 },
  { id: '3', code: 'RC-001', description: 'Grade 40 Concrete – Foundation', unit: 'm³', measureType: 'direct', totalQty: 3500, executedQty: 2170, rate: 850 },
  { id: '4', code: 'RC-002', description: 'Grade 40 Concrete – Columns', unit: 'm³', measureType: 'direct', totalQty: 1200, executedQty: 0, rate: 900 },
  { id: '5', code: 'RB-001', description: 'Rebar Supply & Fix – 16mm', unit: 'ton', measureType: 'rebar', totalQty: 450, executedQty: 279, rate: 4200 },
  { id: '6', code: 'RB-002', description: 'Rebar Supply & Fix – 25mm', unit: 'ton', measureType: 'rebar', totalQty: 320, executedQty: 198, rate: 4500 },
  { id: '7', code: 'FW-001', description: 'Formwork – Foundation', unit: 'm²', measureType: 'rectangular', totalQty: 12000, executedQty: 7440, rate: 120 },
  { id: '8', code: 'WP-001', description: 'Waterproofing Membrane', unit: 'm²', measureType: 'rectangular', totalQty: 6000, executedQty: 0, rate: 85 },
];

export const sampleInventory: InventoryItem[] = [
  { id: '1', code: 'MAT-001', description: 'Portland Cement OPC 42.5', unit: 'bag', opening: 500, receipts: 2000, issues: 1800, balance: 700, minLevel: 200, location: 'Warehouse A' },
  { id: '2', code: 'MAT-002', description: 'Fine Aggregate (Sand)', unit: 'ton', opening: 150, receipts: 400, issues: 380, balance: 170, minLevel: 50, location: 'Stockyard' },
  { id: '3', code: 'MAT-003', description: 'Coarse Aggregate 20mm', unit: 'ton', opening: 200, receipts: 600, issues: 550, balance: 250, minLevel: 80, location: 'Stockyard' },
  { id: '4', code: 'MAT-004', description: 'Rebar 16mm Y Bar', unit: 'ton', opening: 45, receipts: 120, issues: 135, balance: 30, minLevel: 20, location: 'Rebar Yard' },
  { id: '5', code: 'MAT-005', description: 'Plywood 18mm (Formwork)', unit: 'sheet', opening: 300, receipts: 800, issues: 900, balance: 200, minLevel: 100, location: 'Warehouse B' },
  { id: '6', code: 'MAT-006', description: 'Diesel Fuel', unit: 'liter', opening: 5000, receipts: 15000, issues: 14500, balance: 5500, minLevel: 2000, location: 'Fuel Station' },
];

export const sampleManpower: ManpowerEntry[] = [
  { id: '1', date: '2025-03-03', location: 'Zone A – Piling', mason: 0, carpenter: 4, steel: 8, welder: 2, fitter: 3, electrician: 0, operator: 4, skilled: 21, unskilled: 35, supervisor: 'Ahmad K.' },
  { id: '2', date: '2025-03-03', location: 'Zone B – Excavation', mason: 0, carpenter: 0, steel: 0, welder: 0, fitter: 0, electrician: 0, operator: 6, skilled: 6, unskilled: 45, supervisor: 'Ravi M.' },
  { id: '3', date: '2025-03-02', location: 'Zone A – Piling', mason: 0, carpenter: 4, steel: 10, welder: 2, fitter: 3, electrician: 0, operator: 4, skilled: 23, unskilled: 38, supervisor: 'Ahmad K.' },
];

export const sampleEquipment: EquipmentEntry[] = [
  { id: '1', date: '2025-03-03', eqId: 'EQ-001', equipmentName: 'CAT 320 Excavator', description: 'Hydraulic excavator 20T', operator: 'Singh R.', ownership: 'owned', hours: 9.5, fuel: 180, activity: 'Excavation Zone B', issues: '' },
  { id: '2', date: '2025-03-03', eqId: 'EQ-002', equipmentName: 'Liebherr Piling Rig', description: 'CFA piling rig', operator: 'Ahmed F.', ownership: 'leased', hours: 8, fuel: 250, activity: 'Piling Zone A', issues: '' },
  { id: '3', date: '2025-03-03', eqId: 'EQ-003', equipmentName: 'Mobile Crane 50T', description: 'Telescopic crane', operator: 'Wang L.', ownership: 'rented', hours: 6, fuel: 120, activity: 'Rebar lifting', issues: 'Slewing ring noise' },
  { id: '4', date: '2025-03-03', eqId: 'EQ-004', equipmentName: 'Concrete Pump Truck', description: 'Boom pump 36m', operator: 'Kumar P.', ownership: 'leased', hours: 4.5, fuel: 90, activity: 'Pile cap pour', issues: '' },
];

export const sampleSafety: SafetyIncident[] = [
  { id: '1', date: '2025-03-01', type: 'near-miss', location: 'Zone A', description: 'Unsecured load on crane', injured: '', cause: 'Improper rigging', preventive: 'Re-train riggers, add checklist', reporter: 'Safety Officer' },
  { id: '2', date: '2025-02-25', type: 'observation', location: 'Warehouse', description: 'Missing fire extinguisher', injured: '', cause: 'Moved during reorganization', preventive: 'Fixed location markers installed', reporter: 'HSE Manager' },
];

export const sampleDelays: DelayEntry[] = [
  { id: '1', date: '2025-02-20', activity: 'Piling Works', description: 'Rig breakdown – hydraulic failure', cause: 'Mechanical', duration: 3, impact: 'Critical path delayed 3 days', recovery: 'Mobilized standby rig', status: 'mitigated' },
  { id: '2', date: '2025-03-01', activity: 'Excavation', description: 'Heavy rainfall – site flooding', cause: 'Weather', duration: 2, impact: 'Minor delay, non-critical', recovery: 'Dewatering pumps deployed', status: 'closed' },
];

export const samplePOs: PurchaseOrder[] = [
  { id: '1', poNo: 'PO-2025-001', supplier: 'Gulf Ready Mix', date: '2025-01-20', itemCode: 'RC-001', qty: 500, price: 425000, status: 'delivered', remarks: 'Grade 40, 150mm slump' },
  { id: '2', poNo: 'PO-2025-002', supplier: 'National Steel Co.', date: '2025-02-05', itemCode: 'RB-001', qty: 150, price: 630000, status: 'delivered', remarks: '16mm Y-bar' },
  { id: '3', poNo: 'PO-2025-003', supplier: 'Al-Futtaim Formwork', date: '2025-02-15', itemCode: 'FW-001', qty: 5000, price: 600000, status: 'issued', remarks: 'Doka system formwork' },
];

export const projectInfo = {
  name: 'Marina Bay Commercial Complex',
  client: 'Marina Bay Developments LLC',
  contractor: 'BuildForge Engineering',
  location: 'Dubai Marina, Plot 47',
  startDate: '2025-01-15',
  endDate: '2027-06-30',
  contractValue: 285000000,
  currency: 'AED',
};
