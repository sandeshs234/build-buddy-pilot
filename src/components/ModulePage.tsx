import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface ModulePageProps<T> {
  title: string;
  description: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function ModulePage<T extends { id: string }>({ title, description, columns, data, emptyMessage }: ModulePageProps<T>) {
  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {emptyMessage || 'No records yet. Start by adding your first entry.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
