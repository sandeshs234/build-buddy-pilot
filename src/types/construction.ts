export interface Activity {
  id: string;
  wbs: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  percentComplete: number;
  critical: boolean;
  predecessors?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
}

export interface BOQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  measureType: 'direct' | 'rectangular' | 'trapezoidal' | 'rebar';
  totalQty: number;
  executedQty: number;
  rate: number;
}

export interface InventoryItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  opening: number;
  receipts: number;
  issues: number;
  balance: number;
  minLevel: number;
  location: string;
  requiredQty?: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplier: string;
  date: string;
  itemCode: string;
  qty: number;
  price: number;
  status: 'draft' | 'issued' | 'delivered' | 'closed';
  remarks: string;
}

export interface ManpowerEntry {
  id: string;
  date: string;
  location: string;
  mason: number;
  carpenter: number;
  steel: number;
  welder: number;
  fitter: number;
  electrician: number;
  operator: number;
  skilled: number;
  unskilled: number;
  supervisor: string;
}

export interface EquipmentEntry {
  id: string;
  date: string;
  eqId: string;
  equipmentName: string;
  description: string;
  operator: string;
  ownership: 'owned' | 'leased' | 'rented';
  hours: number;
  fuel: number;
  activity: string;
  issues: string;
}

export interface SafetyIncident {
  id: string;
  date: string;
  type: 'incident' | 'near-miss' | 'observation';
  location: string;
  description: string;
  injured: string;
  cause: string;
  preventive: string;
  reporter: string;
}

export interface DelayEntry {
  id: string;
  date: string;
  activity: string;
  description: string;
  cause: string;
  duration: number;
  impact: string;
  recovery: string;
  status: 'open' | 'mitigated' | 'closed';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}
