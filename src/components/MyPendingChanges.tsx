import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Check, X, FileText, Trash2, Pencil, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MyChange {
  id: string;
  table_name: string;
  operation: string;
  data: any;
  original_data: any;
  rejection_reason: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export default function MyPendingChanges() {
  const { user, currentProjectId } = useAuth();
  const [changes, setChanges] = useState<MyChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [editingChange, setEditingChange] = useState<MyChange | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const fetchMyChanges = async () => {
    if (!user) return;
    setLoading(true);
    let query = (supabase as any)
      .from('data_changes')
      .select('id, table_name, operation, data, original_data, rejection_reason, status, created_at, approved_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (currentProjectId) {
      query = query.eq('project_id', currentProjectId);
    }

    const { data } = await query;
    setChanges(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMyChanges(); }, [user, currentProjectId]);

  useEffect(() => {
    if (!currentProjectId) return;
    const channel = supabase
      .channel(`my-changes-${user?.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'data_changes',
      }, () => fetchMyChanges())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, currentProjectId]);

  const cancelChange = async (changeId: string) => {
    setCancelling(changeId);
    const { error } = await (supabase as any)
      .from('data_changes')
      .delete()
      .eq('id', changeId)
      .eq('user_id', user?.id)
      .eq('status', 'pending');

    if (error) {
      toast({ title: '❌ Failed to cancel', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🗑️ Cancelled', description: 'Your pending submission has been cancelled.' });
      setChanges(prev => prev.filter(c => c.id !== changeId));
    }
    setCancelling(null);
  };

  const deleteRejected = async (changeId: string) => {
    setCancelling(changeId);
    const { error } = await (supabase as any)
      .from('data_changes')
      .delete()
      .eq('id', changeId)
      .eq('user_id', user?.id)
      .eq('status', 'rejected');

    if (error) {
      toast({ title: '❌ Failed to delete', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🗑️ Deleted', description: 'Rejected submission removed.' });
      setChanges(prev => prev.filter(c => c.id !== changeId));
    }
    setCancelling(null);
  };

  const resubmitChange = async () => {
    if (!editingChange) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from('data_changes')
      .update({ data: editData, status: 'pending', rejection_reason: null, approved_at: null, approved_by: null })
      .eq('id', editingChange.id)
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: '❌ Failed to resubmit', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🔄 Resubmitted', description: 'Your change has been resubmitted for approval.' });
      setChanges(prev => prev.map(c => c.id === editingChange.id ? { ...c, data: editData, status: 'pending', rejection_reason: null } : c));
      setEditingChange(null);
    }
    setSaving(false);
  };

  const openEdit = (change: MyChange) => {
    setEditingChange(change);
    setEditData({ ...(typeof change.data === 'object' ? change.data : {}) });
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const saveEdit = async () => {
    if (!editingChange) return;
    setSaving(true);
    // Save original_data only on the first edit (preserve the very first version)
    const updatePayload: any = { data: editData };
    if (!editingChange.original_data) {
      updatePayload.original_data = editingChange.data;
    }
    const { error } = await (supabase as any)
      .from('data_changes')
      .update(updatePayload)
      .eq('id', editingChange.id)
      .eq('user_id', user?.id)
      .eq('status', 'pending');

    if (error) {
      toast({ title: '❌ Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✏️ Updated', description: 'Your pending submission has been updated.' });
      setChanges(prev => prev.map(c => c.id === editingChange.id ? { ...c, data: editData } : c));
      setEditingChange(null);
    }
    setSaving(false);
  };

  // Fields to hide from the edit form (internal/system fields)
  const hiddenFields = ['id', 'user_id', 'project_id', 'created_at', 'updated_at'];

  const getEditableFields = (data: Record<string, any>) => {
    return Object.entries(data).filter(([key]) => !hiddenFields.includes(key));
  };

  const formatFieldLabel = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]"><Clock size={10} className="mr-1" />Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500/20 text-green-700 border-green-300 text-[10px]"><Check size={10} className="mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px]"><X size={10} className="mr-1" />Rejected</Badge>;
      default: return null;
    }
  };

  const opLabel = (op: string) => {
    switch (op) {
      case 'insert': return <span className="text-green-600 font-medium text-xs">+ New</span>;
      case 'update': return <span className="text-blue-600 font-medium text-xs">~ Edit</span>;
      case 'delete': return <span className="text-red-600 font-medium text-xs">- Delete</span>;
      default: return null;
    }
  };

  const pendingCount = changes.filter(c => c.status === 'pending').length;

  if (loading) return null;
  if (changes.length === 0) return null;

  return (
    <>
      <div className="bg-card rounded-xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">My Submitted Changes</h2>
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                {pendingCount} pending
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {changes.map(change => (
            <div key={change.id} className="bg-muted/30 rounded-lg px-3 py-2 border space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {opLabel(change.operation)}
                  <span className="text-sm text-foreground capitalize truncate">
                    {change.table_name.replace(/_/g, ' ')}
                  </span>
                </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {statusIcon(change.status)}
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(change.created_at), 'MMM d, HH:mm')}
                </span>
                {change.status === 'pending' && change.operation !== 'delete' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => openEdit(change)}
                    title="Edit this submission"
                  >
                    <Pencil size={12} />
                  </Button>
                )}
                {change.status === 'pending' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={cancelling === change.id}
                        title="Cancel this submission"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove your pending {change.operation} on {change.table_name.replace(/_/g, ' ')}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancelChange(change.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, cancel it
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              </div>
              {change.status === 'rejected' && change.rejection_reason && (
                <div className="flex items-start gap-1.5 mt-1">
                  <MessageSquare size={10} className="text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{change.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Pending Submission Dialog */}
      <Dialog open={!!editingChange} onOpenChange={(open) => { if (!open) setEditingChange(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Pending Submission</DialogTitle>
            <DialogDescription>
              Modify your {editingChange?.operation} on {editingChange?.table_name.replace(/_/g, ' ')} before admin reviews it.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {editingChange && getEditableFields(editData).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{formatFieldLabel(key)}</Label>
                  <Input
                    value={String(value ?? '')}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingChange(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
