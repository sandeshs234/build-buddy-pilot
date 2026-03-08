import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Check, X, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface DataChange {
  id: string;
  project_id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: string;
  data: any;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  profile?: { full_name: string; email: string };
}

interface DataApprovalProps {
  projectId: string;
}

export default function DataApproval({ projectId }: DataApprovalProps) {
  const { user } = useAuth();
  const [changes, setChanges] = useState<DataChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

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

  // Subscribe to realtime updates
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

  const approveChange = async (changeId: string) => {
    await (supabase as any)
      .from('data_changes')
      .update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', changeId);
    toast({ title: 'Change approved' });
    fetchChanges();
  };

  const rejectChange = async (changeId: string) => {
    await (supabase as any)
      .from('data_changes')
      .update({ status: 'rejected', approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq('id', changeId);
    toast({ title: 'Change rejected' });
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getOperationBadge(change.operation)}
                <span className="text-sm font-medium text-foreground capitalize">{change.table_name.replace(/_/g, ' ')}</span>
                {getStatusBadge(change.status)}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(change.created_at), 'MMM d, HH:mm')}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              By: {change.profile?.full_name || change.profile?.email || 'Unknown'}
            </div>
            <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto max-h-32">
              {JSON.stringify(change.data, null, 2)}
            </pre>
            {change.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => approveChange(change.id)} className="bg-green-600 hover:bg-green-700">
                  <Check size={14} className="mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => rejectChange(change.id)}>
                  <X size={14} className="mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
