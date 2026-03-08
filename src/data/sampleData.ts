import { Activity, BOQItem, InventoryItem, ManpowerEntry, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';

export const sampleActivities: Activity[] = [
  { id: '1', wbs: '1.1', name: 'Site Mobilization & Setup', plannedStart: '2025-01-15', plannedEnd: '2025-02-15', actualStart: '2025-01-15', actualEnd: '2025-02-10', percentComplete: 100, critical: true, status: 'completed' },
  { id: '2', wbs: '1.2', name: 'Excavation & Earthworks', plannedStart: '2025-02-16', plannedEnd: '2025-04-30', actualStart: '2025-02-11', actualEnd: '2025-04-25', percentComplete: 100, critical: true, status: 'completed' },
  { id: '3', wbs: '1.3', name: 'Dewatering & Ground Improvement', plannedStart: '2025-02-20', plannedEnd: '2025-03-20', actualStart: '2025-02-22', actualEnd: '2025-03-18', percentComplete: 100, critical: false, status: 'completed' },
  { id: '4', wbs: '2.1', name: 'Foundation – Piling Works (CFA)', plannedStart: '2025-03-01', plannedEnd: '2025-06-30', actualStart: '2025-03-05', actualEnd: '2025-06-28', percentComplete: 100, critical: true, status: 'completed', predecessors: '1.2' },
  { id: '5', wbs: '2.2', name: 'Foundation – Pile Caps & Tie Beams', plannedStart: '2025-05-01', plannedEnd: '2025-07-31', actualStart: '2025-05-03', actualEnd: '2025-07-28', percentComplete: 100, critical: true, status: 'completed', predecessors: '2.1' },
  { id: '6', wbs: '2.3', name: 'Foundation – Raft & Grade Beams', plannedStart: '2025-06-01', plannedEnd: '2025-08-15', actualStart: '2025-06-05', actualEnd: '2025-08-12', percentComplete: 100, critical: false, status: 'completed', predecessors: '2.1' },
  { id: '7', wbs: '3.1', name: 'Substructure Concrete (B2–GF)', plannedStart: '2025-07-01', plannedEnd: '2025-09-30', actualStart: '2025-07-02', actualEnd: '2025-09-25', percentComplete: 100, critical: true, status: 'completed', predecessors: '2.2' },
  { id: '8', wbs: '3.2', name: 'Basement Waterproofing System', plannedStart: '2025-07-15', plannedEnd: '2025-09-15', actualStart: '2025-07-18', actualEnd: '2025-09-10', percentComplete: 100, critical: false, status: 'completed' },
  { id: '9', wbs: '3.3', name: 'Backfill & Compaction Around Basement', plannedStart: '2025-09-01', plannedEnd: '2025-10-15', actualStart: '2025-09-05', actualEnd: '2025-10-12', percentComplete: 100, critical: false, status: 'completed', predecessors: '3.2' },
  { id: '10', wbs: '4.1', name: 'Superstructure – Columns L1–L5', plannedStart: '2025-08-01', plannedEnd: '2025-12-31', actualStart: '2025-08-05', percentComplete: 92, critical: true, status: 'in-progress', predecessors: '3.1' },
  { id: '11', wbs: '4.2', name: 'Superstructure – Slabs & Beams L1–L5', plannedStart: '2025-09-01', plannedEnd: '2026-02-28', actualStart: '2025-09-08', percentComplete: 85, critical: true, status: 'in-progress', predecessors: '4.1' },
  { id: '12', wbs: '4.3', name: 'Superstructure – Shear Walls & Core', plannedStart: '2025-08-15', plannedEnd: '2026-01-31', actualStart: '2025-08-20', percentComplete: 88, critical: true, status: 'in-progress', predecessors: '3.1' },
  { id: '13', wbs: '5.1', name: 'MEP Rough-in (Electrical)', plannedStart: '2025-10-01', plannedEnd: '2026-03-31', actualStart: '2025-10-05', percentComplete: 72, critical: false, status: 'in-progress' },
  { id: '14', wbs: '5.2', name: 'MEP Rough-in (Mechanical/HVAC)', plannedStart: '2025-10-15', plannedEnd: '2026-04-15', actualStart: '2025-10-20', percentComplete: 68, critical: false, status: 'in-progress' },
  { id: '15', wbs: '5.3', name: 'MEP Rough-in (Plumbing & Fire)', plannedStart: '2025-11-01', plannedEnd: '2026-04-30', actualStart: '2025-11-05', percentComplete: 60, critical: false, status: 'in-progress' },
  { id: '16', wbs: '6.1', name: 'Façade Installation – Curtain Wall', plannedStart: '2026-01-01', plannedEnd: '2026-06-30', actualStart: '2026-01-05', percentComplete: 35, critical: false, status: 'in-progress' },
  { id: '17', wbs: '6.2', name: 'External Cladding & Finishes', plannedStart: '2026-02-01', plannedEnd: '2026-07-31', actualStart: '2026-02-08', percentComplete: 20, critical: false, status: 'in-progress' },
  { id: '18', wbs: '7.1', name: 'Internal Blockwork & Plastering', plannedStart: '2026-01-15', plannedEnd: '2026-05-31', actualStart: '2026-01-20', percentComplete: 45, critical: false, status: 'in-progress' },
  { id: '19', wbs: '7.2', name: 'Tiling, Flooring & Painting', plannedStart: '2026-03-01', plannedEnd: '2026-07-15', percentComplete: 10, critical: false, status: 'in-progress' },
  { id: '20', wbs: '8.1', name: 'External Works & Landscaping', plannedStart: '2026-04-01', plannedEnd: '2026-08-31', percentComplete: 0, critical: false, status: 'not-started' },
];

export const sampleBOQ: BOQItem[] = [
  { id: '1', code: 'EW-001', description: 'Bulk Excavation in All Types of Soil', unit: 'm³', measureType: 'rectangular', totalQty: 25000, executedQty: 25000, rate: 45 },
  { id: '2', code: 'EW-002', description: 'Backfill & Compaction (95% MDD)', unit: 'm³', measureType: 'rectangular', totalQty: 8000, executedQty: 7600, rate: 35 },
  { id: '3', code: 'EW-003', description: 'Disposal of Surplus Material', unit: 'm³', measureType: 'rectangular', totalQty: 12000, executedQty: 12000, rate: 28 },
  { id: '4', code: 'RC-001', description: 'Grade C40 Concrete – Foundation', unit: 'm³', measureType: 'direct', totalQty: 3500, executedQty: 3500, rate: 850 },
  { id: '5', code: 'RC-002', description: 'Grade C40 Concrete – Columns', unit: 'm³', measureType: 'direct', totalQty: 1200, executedQty: 1050, rate: 900 },
  { id: '6', code: 'RC-003', description: 'Grade C40 Concrete – Slabs & Beams', unit: 'm³', measureType: 'direct', totalQty: 4500, executedQty: 3825, rate: 880 },
  { id: '7', code: 'RC-004', description: 'Grade C30 Concrete – Blinding & Lean', unit: 'm³', measureType: 'direct', totalQty: 800, executedQty: 800, rate: 650 },
  { id: '8', code: 'RB-001', description: 'Rebar Supply & Fix – 16mm Y Bar', unit: 'ton', measureType: 'rebar', totalQty: 450, executedQty: 400, rate: 4200 },
  { id: '9', code: 'RB-002', description: 'Rebar Supply & Fix – 25mm Y Bar', unit: 'ton', measureType: 'rebar', totalQty: 320, executedQty: 280, rate: 4500 },
  { id: '10', code: 'RB-003', description: 'Rebar Supply & Fix – 32mm Y Bar', unit: 'ton', measureType: 'rebar', totalQty: 180, executedQty: 155, rate: 4800 },
  { id: '11', code: 'FW-001', description: 'Formwork – Foundation (Plywood)', unit: 'm²', measureType: 'rectangular', totalQty: 12000, executedQty: 12000, rate: 120 },
  { id: '12', code: 'FW-002', description: 'Formwork – Columns (Steel)', unit: 'm²', measureType: 'rectangular', totalQty: 5000, executedQty: 4500, rate: 150 },
  { id: '13', code: 'FW-003', description: 'Formwork – Slabs (Table Form)', unit: 'm²', measureType: 'rectangular', totalQty: 18000, executedQty: 15300, rate: 95 },
  { id: '14', code: 'WP-001', description: 'Waterproofing Membrane – Basement', unit: 'm²', measureType: 'rectangular', totalQty: 6000, executedQty: 6000, rate: 85 },
  { id: '15', code: 'WP-002', description: 'Waterproofing – Wet Areas', unit: 'm²', measureType: 'rectangular', totalQty: 3500, executedQty: 1400, rate: 75 },
  { id: '16', code: 'BW-001', description: 'Blockwork 200mm (AAC Blocks)', unit: 'm²', measureType: 'rectangular', totalQty: 15000, executedQty: 6750, rate: 65 },
  { id: '17', code: 'PL-001', description: 'Internal Plastering 15mm', unit: 'm²', measureType: 'rectangular', totalQty: 28000, executedQty: 8400, rate: 35 },
  { id: '18', code: 'ST-001', description: 'Structural Steel Members', unit: 'ton', measureType: 'direct', totalQty: 250, executedQty: 220, rate: 8500 },
];

export const sampleInventory: InventoryItem[] = [
  { id: '1', code: 'MAT-001', description: 'Portland Cement OPC 42.5', unit: 'bag', opening: 500, receipts: 8500, issues: 7800, balance: 1200, minLevel: 200, location: 'Warehouse A' },
  { id: '2', code: 'MAT-002', description: 'Fine Aggregate (Washed Sand)', unit: 'ton', opening: 150, receipts: 1800, issues: 1650, balance: 300, minLevel: 50, location: 'Stockyard North' },
  { id: '3', code: 'MAT-003', description: 'Coarse Aggregate 20mm', unit: 'ton', opening: 200, receipts: 2200, issues: 2050, balance: 350, minLevel: 80, location: 'Stockyard South' },
  { id: '4', code: 'MAT-004', description: 'Rebar 16mm Y460 Grade B', unit: 'ton', opening: 45, receipts: 420, issues: 400, balance: 65, minLevel: 20, location: 'Rebar Yard' },
  { id: '5', code: 'MAT-005', description: 'Rebar 25mm Y460 Grade B', unit: 'ton', opening: 30, receipts: 300, issues: 280, balance: 50, minLevel: 15, location: 'Rebar Yard' },
  { id: '6', code: 'MAT-006', description: 'Plywood 18mm Marine Grade', unit: 'sheet', opening: 300, receipts: 3500, issues: 3200, balance: 600, minLevel: 100, location: 'Warehouse B' },
  { id: '7', code: 'MAT-007', description: 'Diesel Fuel', unit: 'liter', opening: 5000, receipts: 85000, issues: 82000, balance: 8000, minLevel: 2000, location: 'Fuel Station' },
  { id: '8', code: 'MAT-008', description: 'Waterproofing Membrane Roll', unit: 'roll', opening: 50, receipts: 350, issues: 320, balance: 80, minLevel: 20, location: 'Warehouse A' },
  { id: '9', code: 'MAT-009', description: 'AAC Blocks 200mm', unit: 'pcs', opening: 2000, receipts: 18000, issues: 15000, balance: 5000, minLevel: 1000, location: 'Block Yard' },
  { id: '10', code: 'MAT-010', description: 'Structural Steel Sections', unit: 'ton', opening: 20, receipts: 240, issues: 220, balance: 40, minLevel: 10, location: 'Steel Yard' },
  { id: '11', code: 'MAT-011', description: 'Admixture – Superplasticizer', unit: 'liter', opening: 200, receipts: 4500, issues: 4200, balance: 500, minLevel: 100, location: 'Chemical Store' },
  { id: '12', code: 'MAT-012', description: 'Scaffolding Pipes & Couplers', unit: 'set', opening: 100, receipts: 500, issues: 480, balance: 120, minLevel: 30, location: 'Scaffold Yard' },
];

export const sampleManpower: ManpowerEntry[] = [
  { id: '1', date: '2026-03-07', location: 'Zone A – Superstructure L4', mason: 8, carpenter: 12, steel: 15, welder: 4, fitter: 3, electrician: 6, operator: 5, skilled: 53, unskilled: 45, supervisor: 'Ahmad K.' },
  { id: '2', date: '2026-03-07', location: 'Zone B – Superstructure L3', mason: 6, carpenter: 10, steel: 12, welder: 3, fitter: 2, electrician: 4, operator: 3, skilled: 40, unskilled: 38, supervisor: 'Ravi M.' },
  { id: '3', date: '2026-03-07', location: 'Zone C – MEP Rough-in', mason: 0, carpenter: 2, steel: 0, welder: 5, fitter: 8, electrician: 12, operator: 0, skilled: 27, unskilled: 15, supervisor: 'Chen W.' },
  { id: '4', date: '2026-03-06', location: 'Zone A – Superstructure L4', mason: 8, carpenter: 14, steel: 16, welder: 4, fitter: 3, electrician: 5, operator: 5, skilled: 55, unskilled: 48, supervisor: 'Ahmad K.' },
  { id: '5', date: '2026-03-06', location: 'Zone B – Superstructure L3', mason: 6, carpenter: 10, steel: 12, welder: 3, fitter: 2, electrician: 4, operator: 4, skilled: 41, unskilled: 40, supervisor: 'Ravi M.' },
  { id: '6', date: '2026-03-05', location: 'Zone A – Superstructure L3', mason: 10, carpenter: 15, steel: 18, welder: 5, fitter: 4, electrician: 6, operator: 6, skilled: 64, unskilled: 52, supervisor: 'Ahmad K.' },
  { id: '7', date: '2026-03-05', location: 'Zone D – Façade Works', mason: 0, carpenter: 4, steel: 2, welder: 3, fitter: 6, electrician: 0, operator: 2, skilled: 17, unskilled: 20, supervisor: 'Omar S.' },
  { id: '8', date: '2026-03-04', location: 'Zone A – Superstructure L3', mason: 10, carpenter: 14, steel: 16, welder: 5, fitter: 3, electrician: 5, operator: 5, skilled: 58, unskilled: 50, supervisor: 'Ahmad K.' },
];

export const sampleEquipment: EquipmentEntry[] = [
  { id: '1', date: '2026-03-07', eqId: 'EQ-001', equipmentName: 'CAT 320 Excavator', description: 'Hydraulic excavator 20T', operator: 'Singh R.', ownership: 'owned', hours: 9.5, fuel: 180, activity: 'External Works Excavation', issues: '' },
  { id: '2', date: '2026-03-07', eqId: 'EQ-002', equipmentName: 'Tower Crane TC-7035', description: 'Luffing tower crane 12T', operator: 'Ahmed F.', ownership: 'leased', hours: 10, fuel: 0, activity: 'Slab formwork lifting L4', issues: '' },
  { id: '3', date: '2026-03-07', eqId: 'EQ-003', equipmentName: 'Mobile Crane 50T', description: 'Liebherr LTM 1050', operator: 'Wang L.', ownership: 'rented', hours: 8, fuel: 120, activity: 'Steel erection Zone B', issues: '' },
  { id: '4', date: '2026-03-07', eqId: 'EQ-004', equipmentName: 'Concrete Pump (Boom 36m)', description: 'Putzmeister BSF 36', operator: 'Kumar P.', ownership: 'leased', hours: 6, fuel: 90, activity: 'Slab pour L3 Zone B', issues: '' },
  { id: '5', date: '2026-03-07', eqId: 'EQ-005', equipmentName: 'Boom Lift 60ft', description: 'Genie S-60', operator: 'Ali H.', ownership: 'rented', hours: 8, fuel: 45, activity: 'Façade installation', issues: '' },
  { id: '6', date: '2026-03-07', eqId: 'EQ-006', equipmentName: 'Generator 500KVA', description: 'CAT C15 diesel genset', operator: 'Self', ownership: 'owned', hours: 12, fuel: 280, activity: 'Site power supply', issues: '' },
  { id: '7', date: '2026-03-06', eqId: 'EQ-002', equipmentName: 'Tower Crane TC-7035', description: 'Luffing tower crane 12T', operator: 'Ahmed F.', ownership: 'leased', hours: 10, fuel: 0, activity: 'Column formwork L4', issues: '' },
  { id: '8', date: '2026-03-06', eqId: 'EQ-004', equipmentName: 'Concrete Pump (Boom 36m)', description: 'Putzmeister BSF 36', operator: 'Kumar P.', ownership: 'leased', hours: 5, fuel: 75, activity: 'Column pour L4 Zone A', issues: 'Minor blockage cleared' },
  { id: '9', date: '2026-03-05', eqId: 'EQ-007', equipmentName: 'Roller / Compactor', description: 'Dynapac CA2500', operator: 'Raj T.', ownership: 'owned', hours: 7, fuel: 65, activity: 'Backfill compaction external', issues: '' },
  { id: '10', date: '2026-03-05', eqId: 'EQ-008', equipmentName: 'Concrete Mixer Truck', description: 'Schwing Stetter 8m³', operator: 'Yusuf M.', ownership: 'rented', hours: 6, fuel: 110, activity: 'Concrete delivery L3', issues: '' },
];

export const sampleSafety: SafetyIncident[] = [
  { id: '1', date: '2026-03-05', type: 'near-miss', location: 'Zone A – Level 4', description: 'Unsecured formwork panel shifted during crane lift', injured: '', cause: 'Improper rigging procedure', preventive: 'Re-train riggers, mandatory 4-point sling for panels', reporter: 'HSE Officer – Ali' },
  { id: '2', date: '2026-03-02', type: 'observation', location: 'MEP Floor L2', description: 'Missing fire extinguisher at welding bay', injured: '', cause: 'Relocated during area cleanup', preventive: 'Fixed wall brackets with signage installed', reporter: 'HSE Manager – Ahmed' },
  { id: '3', date: '2026-02-28', type: 'incident', location: 'Scaffold Area Zone B', description: 'Worker minor hand laceration from exposed rebar end', injured: 'Mohammad R.', cause: 'Missing rebar caps on exposed dowels', preventive: 'Mandatory mushroom caps on all exposed bars, daily inspection', reporter: 'Site Engineer – Ravi' },
  { id: '4', date: '2026-02-20', type: 'near-miss', location: 'Tower Crane Radius', description: 'Load swung near occupied scaffold due to wind gust', injured: '', cause: 'Lifting in borderline wind speed', preventive: 'Revised wind limit to 30km/h, digital anemometer installed', reporter: 'Crane Supervisor – Wang' },
  { id: '5', date: '2026-02-15', type: 'observation', location: 'Main Access Road', description: 'Dump truck reversing without banksman', injured: '', cause: 'Banksman on break, no replacement assigned', preventive: 'Mandatory backup banksman system implemented', reporter: 'HSE Officer – Ali' },
  { id: '6', date: '2026-02-10', type: 'observation', location: 'Chemical Store', description: 'MSDS sheets not updated for new admixture delivery', injured: '', cause: 'Supplier delivered without documentation', preventive: 'Gate control: reject deliveries without MSDS', reporter: 'Store Keeper – Rashid' },
];

export const sampleDelays: DelayEntry[] = [
  { id: '1', date: '2025-06-15', activity: 'Piling Works', description: 'Piling rig hydraulic pump failure – 3 day repair', cause: 'Mechanical breakdown', duration: 3, impact: 'Critical path delayed 3 days, recovered with overtime', recovery: 'Mobilized standby rig, extended shifts', status: 'closed' },
  { id: '2', date: '2025-09-01', activity: 'Substructure Concrete', description: 'Heavy rainfall – site flooding in excavation area', cause: 'Adverse weather', duration: 2, impact: 'Minor delay, non-critical activities affected', recovery: 'Dewatering pumps deployed, weekend catch-up', status: 'closed' },
  { id: '3', date: '2025-11-10', activity: 'Rebar Supply', description: 'Shipment delayed at port – customs clearance issue', cause: 'Supply chain / logistics', duration: 5, impact: 'Slab L2 pour delayed 5 days', recovery: 'Sourced local alternative, air freight for critical bars', status: 'closed' },
  { id: '4', date: '2026-01-20', activity: 'Façade Installation', description: 'Curtain wall panels manufacturing delay', cause: 'Supplier production backlog', duration: 15, impact: 'Façade start delayed, non-critical path', recovery: 'Phased delivery agreed, priority production slot secured', status: 'mitigated' },
  { id: '5', date: '2026-02-25', activity: 'MEP Rough-in L3', description: 'Coordination clash between HVAC duct and structural beam', cause: 'Design coordination', duration: 4, impact: 'HVAC installation rerouted, 4-day delay in Zone B', recovery: 'BIM clash resolution, revised routing approved', status: 'mitigated' },
  { id: '6', date: '2026-03-01', activity: 'Superstructure L5', description: 'Concrete pump breakdown during slab pour', cause: 'Mechanical', duration: 1, impact: 'Pour completed next day, cold joint treated', recovery: 'Backup pump mobilized within 4 hours', status: 'closed' },
];

export const samplePOs: PurchaseOrder[] = [
  { id: '1', poNo: 'PO-2025-001', supplier: 'Gulf Ready Mix LLC', date: '2025-01-20', itemCode: 'RC-001', qty: 3500, price: 2975000, status: 'delivered', remarks: 'Grade C40, 150mm slump, full foundation supply' },
  { id: '2', poNo: 'PO-2025-002', supplier: 'National Steel Industries', date: '2025-02-05', itemCode: 'RB-001', qty: 450, price: 1890000, status: 'delivered', remarks: '16mm Y460 Grade B rebar' },
  { id: '3', poNo: 'PO-2025-003', supplier: 'Al-Futtaim Formwork', date: '2025-02-15', itemCode: 'FW-001', qty: 12000, price: 1440000, status: 'delivered', remarks: 'Doka system formwork – foundation' },
  { id: '4', poNo: 'PO-2025-004', supplier: 'National Steel Industries', date: '2025-03-10', itemCode: 'RB-002', qty: 320, price: 1440000, status: 'delivered', remarks: '25mm Y460 Grade B rebar' },
  { id: '5', poNo: 'PO-2025-005', supplier: 'Sika Waterproofing', date: '2025-06-01', itemCode: 'WP-001', qty: 6000, price: 510000, status: 'delivered', remarks: 'Sika membrane system – basement' },
  { id: '6', poNo: 'PO-2025-006', supplier: 'Gulf Ready Mix LLC', date: '2025-07-15', itemCode: 'RC-002', qty: 1200, price: 1080000, status: 'delivered', remarks: 'Grade C40 – columns phase 1' },
  { id: '7', poNo: 'PO-2025-007', supplier: 'Gulf Ready Mix LLC', date: '2025-08-20', itemCode: 'RC-003', qty: 4500, price: 3960000, status: 'issued', remarks: 'Grade C40 – slabs & beams, phased delivery' },
  { id: '8', poNo: 'PO-2025-008', supplier: 'Al-Futtaim Formwork', date: '2025-09-01', itemCode: 'FW-003', qty: 18000, price: 1710000, status: 'delivered', remarks: 'Table form system – typical floors' },
  { id: '9', poNo: 'PO-2025-009', supplier: 'Emirates Block Factory', date: '2025-12-01', itemCode: 'BW-001', qty: 15000, price: 975000, status: 'issued', remarks: 'AAC blocks 200mm – internal walls' },
  { id: '10', poNo: 'PO-2025-010', supplier: 'Atlas Steel Structures', date: '2025-04-10', itemCode: 'ST-001', qty: 250, price: 2125000, status: 'delivered', remarks: 'Structural steel sections – all phases' },
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
