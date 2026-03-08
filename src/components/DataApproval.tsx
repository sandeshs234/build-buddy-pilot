import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Check, X, Clock, Eye, ArrowRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface DataChange {
  id: string;
  project_id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: string;
  data: any;
  original_data: any;
  rejection_reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  profile?: { full_name: string; email: string };
}

interface DataApprovalProps {
  projectId: string;
}

// Diff component for showing original vs edited
function DataDiff({ original, current }: { original: Record<string, any>; current: Record<string, any> }) {
  const hiddenFields = ['id', 'user_id', 'project_id', 'created_at', 'updated_at'];
  const allKeys = [...new Set([...Object.keys(original), ...Object.keys(current)])].filter(k => !hiddenFields.includes(k));
  const changedKeys = allKeys.filter(k => JSON.stringify(original[k]) !== JSON.stringify(current[k]));

  if (changedKeys.length === 0) return <p className="text-xs text-muted-foreground italic">No fields changed.</p>;

  const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Changed Fields</p>
      {changedKeys.map(key => (
        <div key={key} className="rounded-md border bg-muted/20 px-3 py-2 text-xs">
          <span className="font-medium text-foreground">{formatLabel(key)}</span>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 line-through break-all">
              {String(original[key] ?? '—')}
            </span>
            <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
            <span className="bg-green-500/10 text-green-700 rounded px-1.5 py-0.5 break-all">
              {String(current[key] ?? '—')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataApproval({ projectId }: DataApprovalProps) {
  const { user } = useAuth();
  const [changes, setChanges] = useState<DataChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchChanges = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('data_changes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;

    if (data) {
      const userIds = [...new Set(data.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds as string[]);

      const enriched = data.map((d: any) => ({
        ...d,
        profile: profiles?.find(p => p.id === d.user_id),
      }));
      setChanges(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchChanges(); }, [projectId, filter]);

  useEffect(() => {
    const channel = supabase
      .channel(`changes-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'data_changes',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        fetchChanges();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, filter]);

  const applyChangeToTable = async (change: DataChange) => {
    const { table_name, operation, data, record_id } = change;
    try {
      if (operation === 'insert') {
        const cleanData = { ...data };
        delete cleanData.id;
        if (record_id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
          cleanData.id = record_id;
        }
        const { error } = await (supabase as any).from(table_name).upsert(cleanData);
        if (error) throw error;
      } else if (operation === 'update') {
        const { id, ...updateData } = data as any;
        const { error } = await (supabase as any).from(table_name).update(updateData).eq('id', record_id);
        if (error) throw error;
      } else if (operation === 'delete') {
        const { error } = await (supabase as any).from(table_name).delete().eq('id', record_id);
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      toast({ title: 'Apply Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const approveChange = async (changeId: string) => {
    const change = changes.find(c => c.id === changeId);
    if (!change) return;

    const applied = await applyChangeToTable(change);
    if (!applied) return;

    await (supabase as any)
      .from('data_changes')
      .update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', changeId);

    await (supabase as any).from('notifications').insert({
      user_id: change.user_id,
      project_id: change.project_id,
      title: '✅ Your change was approved',
      message: `Your ${change.operation} on ${change.table_name.replace(/_/g, ' ')} has been approved and applied.`,
      type: 'approval_notification',
    });

    toast({ title: '✅ Change approved & applied', description: `Data has been written to ${change.table_name.replace(/_/g, ' ')}` });
    fetchChanges();
  };

  const rejectChange = async (changeId: string, reason: string) => {
    const change = changes.find(c => c.id === changeId);
    if (!change) return;

    await (supabase as any)
      .from('data_changes')
      .update({
        status: 'rejected',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', changeId);

    await (supabase as any).from('notifications').insert({
      user_id: change.user_id,
      project_id: change.project_id,
      title: '❌ Your change was rejected',
      message: `Your ${change.operation} on ${change.table_name.replace(/_/g, ' ')} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
      type: 'approval_notification',
    });

    toast({ title: '❌ Change rejected', description: 'Data has been discarded and will not be applied.' });
    setRejectDialogId(null);
    setRejectReason('');
    fetchChanges();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-amber-600 border-amber-300"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500/20 text-green-700 border-green-300"><Check size={12} className="mr-1" /> Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><X size={12} className="mr-1" /> Rejected</Badge>;
      default: return null;
    }
  };

  const getOperationBadge = (op: string) => {
    switch (op) {
      case 'insert': return <Badge variant="secondary" className="text-green-600">+ Insert</Badge>;
      case 'update': return <Badge variant="secondary" className="text-blue-600">~ Update</Badge>;
      case 'delete': return <Badge variant="secondary" className="text-red-600">- Delete</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Data Approval Queue</h2>
        <div className="flex gap-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && changes.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <Eye size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No {filter === 'all' ? '' : filter} changes</p>
        </div>
      )}

      <div className="space-y-2">
        {changes.map(change => (
          <div key={change.id} className="bg-card border rounded-lg p-4 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === change.id ? null : change.id)}
            >
              <div className="flex items-center gap-2">
                {getOperationBadge(change.operation)}
                <span className="text-sm font-medium text-foreground capitalize">{change.table_name.replace(/_/g, ' ')}</span>
                {getStatusBadge(change.status)}
                {change.original_data && (
                  <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">Edited</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(change.created_at), 'MMM d, HH:mm')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              By: {change.profile?.full_name || change.profile?.email || 'Unknown'}
            </div>

            {expandedId === change.id && (
              <div className="space-y-3">
                {/* Show diff if original_data exists */}
                {change.original_data ? (
                  <DataDiff original={change.original_data} current={change.data} />
                ) : null}

                {/* Always show current data */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {change.original_data ? 'Current Data' : 'Submitted Data'}
                  </p>
                  <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-32">
                    {JSON.stringify(change.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {expandedId !== change.id && !change.original_data && (
              <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-32">
                {JSON.stringify(change.data, null, 2)}
              </pre>
            )}

            {change.status === 'rejected' && change.rejection_reason && (
              <div className="flex items-start gap-2 bg-destructive/5 rounded-md px-3 py-2 border border-destructive/20">
                <MessageSquare size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-destructive uppercase tracking-wider">Rejection Reason</p>
                  <p className="text-xs text-foreground mt-0.5">{change.rejection_reason}</p>
                </div>
              </div>
            )}

            {change.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => approveChange(change.id)} className="bg-green-600 hover:bg-green-700">
                  <Check size={14} className="mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setRejectDialogId(change.id); setRejectReason(''); }}>
                  <X size={14} className="mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={(open) => { if (!open) { setRejectDialogId(null); setRejectReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection so the user understands why their change was not accepted.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason (optional)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogId(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectDialogId && rejectChange(rejectDialogId, rejectReason)}>
              <X size={14} className="mr-1" /> Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}