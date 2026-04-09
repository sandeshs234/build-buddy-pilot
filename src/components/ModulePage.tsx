import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Download } from 'lucide-react';
import * as XLSX from '@e965/xlsx';
import { toast } from '@/hooks/use-toast';
import ModuleGuide from '@/components/ModuleGuide';
import { moduleGuides } from '@/data/moduleGuides';

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
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  fileName?: string;
  extraToolbar?: React.ReactNode;
  guideKey?: string;
}

export default function ModulePage<T extends { id: string }>({
  title, description, columns, data, emptyMessage, onAdd, onEdit, onDelete, fileName, extraToolbar, guideKey,
}: ModulePageProps<T>) {
  const guide = guideKey ? moduleGuides[guideKey] : undefined;

  const handleExport = () => {
    const wsData = data.map(row =>
      Object.fromEntries(columns.map(c => [c.label, (row as any)[c.key]]))
    );
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${fileName || title}.xlsx`);
    toast({ title: 'Exported', description: `${data.length} rows exported` });
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {extraToolbar}
          {data.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={14} className="mr-1.5" /> Export XLS
            </Button>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          )}
        </div>
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
                  {(onEdit || onDelete) && <th>Actions</th>}
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
                    {(onEdit || onDelete) && (
                      <td>
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(item)}>
                              <Pencil size={13} />
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => onDelete(item)}>
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
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
