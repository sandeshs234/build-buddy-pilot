import { ReactNode, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';

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
  onImport?: (data: Record<string, any>[]) => void;
  fileName?: string;
  extraToolbar?: React.ReactNode;
}

export default function ModulePage<T extends { id: string }>({
  title, description, columns, data, emptyMessage, onAdd, onEdit, onDelete, onImport, fileName, extraToolbar,
}: ModulePageProps<T>) {
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        onImport(jsonData);
        toast({ title: 'Imported', description: `${jsonData.length} rows imported` });
      } catch {
        toast({ title: 'Error', description: 'Could not read file', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          {onImport && (
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} className="mr-1.5" /> Import XLS
            </Button>
          )}
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
