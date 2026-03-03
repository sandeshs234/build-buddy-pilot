import { useState, useEffect } from 'react';
import { Activity } from '@/types/construction';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSave: (activity: Activity) => void;
  onDelete?: (id: string) => void;
}

const emptyActivity: Activity = {
  id: '', wbs: '', name: '', plannedStart: '', plannedEnd: '',
  percentComplete: 0, critical: false, status: 'not-started',
};

export default function ActivityDialog({ open, onOpenChange, activity, onSave, onDelete }: ActivityDialogProps) {
  const [form, setForm] = useState<Activity>(emptyActivity);
  const isEdit = !!activity;

  useEffect(() => {
    setForm(activity || { ...emptyActivity, id: crypto.randomUUID() });
  }, [activity, open]);

  const update = (field: keyof Activity, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <Label>WBS Code</Label>
            <Input value={form.wbs} onChange={e => update('wbs', e.target.value)} placeholder="e.g. 1.1" />
          </div>
          <div className="space-y-1.5">
            <Label>Activity Name</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Activity name" />
          </div>
          <div className="space-y-1.5">
            <Label>Planned Start</Label>
            <Input type="date" value={form.plannedStart} onChange={e => update('plannedStart', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Planned End</Label>
            <Input type="date" value={form.plannedEnd} onChange={e => update('plannedEnd', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Actual Start</Label>
            <Input type="date" value={form.actualStart || ''} onChange={e => update('actualStart', e.target.value || undefined)} />
          </div>
          <div className="space-y-1.5">
            <Label>Actual End</Label>
            <Input type="date" value={form.actualEnd || ''} onChange={e => update('actualEnd', e.target.value || undefined)} />
          </div>
          <div className="space-y-1.5">
            <Label>Progress (%)</Label>
            <Input type="number" min={0} max={100} value={form.percentComplete} onChange={e => update('percentComplete', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Predecessors (WBS)</Label>
            <Input value={form.predecessors || ''} onChange={e => update('predecessors', e.target.value || undefined)} placeholder="e.g. 1.2, 2.1" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox checked={form.critical} onCheckedChange={v => update('critical', !!v)} id="critical" />
            <Label htmlFor="critical">Critical Path</Label>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {isEdit && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => { onDelete(form.id); onOpenChange(false); }}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onSave(form); onOpenChange(false); }}>
              {isEdit ? 'Save Changes' : 'Add Activity'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
