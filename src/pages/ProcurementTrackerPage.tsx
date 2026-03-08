import ProcurementTracker from '@/components/ProcurementTracker';

export default function ProcurementTrackerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Procurement Tracker</h1>
        <p className="text-muted-foreground">Track material orders, deliveries, and procurement status</p>
      </div>
      <ProcurementTracker />
    </div>
  );
}
