import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Check, X, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MyChange {
  id: string;
  table_name: string;
  operation: string;
  data: any;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export default function MyPendingChanges() {
  const { user, currentProjectId } = useAuth();
  const [changes, setChanges] = useState<MyChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchMyChanges = async () => {
    if (!user) return;
    setLoading(true);
    let query = (supabase as any)
      .from('data_changes')
      .select('id, table_name, operation, data, status, created_at, approved_at')
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
          <div key={change.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border">
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
              {change.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => cancelChange(change.id)}
                  disabled={cancelling === change.id}
                  title="Cancel this submission"
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
