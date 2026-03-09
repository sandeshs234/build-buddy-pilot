import SupplierPerformance from '@/components/SupplierPerformance';

export default function SupplierPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Supplier Performance</h1>
        <p className="text-muted-foreground">Delivery timeliness, cost variance, and supplier ratings</p>
      </div>
      <SupplierPerformance />
    </div>
  );
}
