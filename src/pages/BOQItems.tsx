import { sampleBOQ } from '@/data/sampleData';

export default function BOQItems() {
  const totalBudget = sampleBOQ.reduce((sum, i) => sum + i.totalQty * i.rate, 0);
  const totalExecuted = sampleBOQ.reduce((sum, i) => sum + i.executedQty * i.rate, 0);

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BOQ / Item Master</h1>
          <p className="text-sm text-muted-foreground mt-1">{sampleBOQ.length} items · Budget: AED {(totalBudget / 1000000).toFixed(1)}M · Executed: AED {(totalExecuted / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Method</th>
                <th className="text-right">Total Qty</th>
                <th className="text-right">Executed</th>
                <th>Progress</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sampleBOQ.map(item => {
                const pct = Math.round((item.executedQty / item.totalQty) * 100);
                return (
                  <tr key={item.id}>
                    <td className="font-mono text-xs font-medium">{item.code}</td>
                    <td className="font-medium">{item.description}</td>
                    <td className="text-muted-foreground">{item.unit}</td>
                    <td className="text-xs text-muted-foreground capitalize">{item.measureType}</td>
                    <td className="text-right font-mono">{item.totalQty.toLocaleString()}</td>
                    <td className="text-right font-mono">{item.executedQty.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="text-right font-mono">{item.rate.toLocaleString()}</td>
                    <td className="text-right font-mono font-medium">{(item.totalQty * item.rate).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50">
                <td colSpan={8} className="px-4 py-3 font-semibold text-sm">Total</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{totalBudget.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
