import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';

interface ExcelImportExportProps<T> {
  data: T[];
  columns: { key: string; label: string }[];
  fileName: string;
  onImport: (data: Record<string, any>[]) => void;
}

export default function ExcelImportExport<T extends Record<string, any>>({
  data, columns, fileName, onImport,
}: ExcelImportExportProps<T>) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const wsData = data.map(row =>
      Object.fromEntries(columns.map(c => [c.label, row[c.key]]))
    );
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast({ title: 'Exported', description: `${data.length} rows exported to ${fileName}.xlsx` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        // Map headers back to keys
        const headerToKey: Record<string, string> = {};
        columns.forEach(c => { headerToKey[c.label.toLowerCase()] = c.key; });

        const mapped = jsonData.map(row => {
          const obj: Record<string, any> = {};
          Object.entries(row).forEach(([header, val]) => {
            const key = headerToKey[header.toLowerCase()] || header;
            obj[key] = val;
          });
          return obj;
        });

        onImport(mapped);
        toast({ title: 'Imported', description: `${mapped.length} rows imported from ${file.name}` });
      } catch {
        toast({ title: 'Import Error', description: 'Could not read the file. Check format.', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload size={14} className="mr-1.5" /> Import XLS
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download size={14} className="mr-1.5" /> Export XLS
      </Button>
    </div>
  );
}
