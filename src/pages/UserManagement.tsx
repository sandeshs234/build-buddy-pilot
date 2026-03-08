import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Shield, Trash2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type AppRole = 'admin' | 'project_manager' | 'engineer' | 'viewer';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  company: string;
  role: AppRole;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  engineer: 'Engineer',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  project_manager: 'bg-primary/10 text-primary border-primary/20',
  engineer: 'bg-accent/10 text-accent-foreground border-accent/20',
  viewer: 'bg-muted text-muted-foreground border-muted',
};

export default function UserManagement() {
  const { isAdmin, currentProjectId } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (!profiles || !roles) return;

    const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role as AppRole]));
    setUsers(profiles.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      company: p.company || '',
      role: roleMap.get(p.id) || 'viewer',
    })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || newPassword.length < 6) {
      toast({ title: 'Fill all fields (min 6 char password)', variant: 'destructive' });
      return;
    }
    setLoading(true);

    // Use edge function to create user (admin-only)
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email: newEmail, password: newPassword, full_name: newName, role: newRole, project_id: currentProjectId },
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User created', description: `${newEmail} added as ${ROLE_LABELS[newRole]}` });
      setDialogOpen(false);
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('viewer');
      fetchUsers();
    }
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase.functions.invoke('admin-update-role', {
      body: { user_id: userId, role: newRole },
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role updated' });
      fetchUsers();
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center">
        <Shield size={48} className="mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create accounts and assign roles · {users.length} users</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus size={14} className="mr-1.5" /> Create User
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="font-medium">{u.full_name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.company || '—'}</td>
                  <td>
                    <Badge variant="outline" className={ROLE_COLORS[u.role]}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </td>
                  <td>
                    <Select value={u.role} onValueChange={(v) => handleChangeRole(u.id, v as AppRole)}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" className="mt-1.5" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@company.com" className="mt-1.5" required />
            </div>
            <div>
              <Label>Password *</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1.5" required minLength={6} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
