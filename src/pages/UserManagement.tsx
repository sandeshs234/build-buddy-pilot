import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Shield, Trash2, Info, CheckCircle2, XCircle, Trash, Loader2 } from 'lucide-react';
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
  const [guideOpen, setGuideOpen] = useState(false);

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


  const permissions = [
    { action: 'View project data', admin: true, pm: true, eng: true, viewer: true },
    { action: 'Add/edit own entries', admin: true, pm: true, eng: true, viewer: false },
    { action: 'Approve/reject entries', admin: true, pm: true, eng: false, viewer: false },
    { action: 'Manage project members', admin: true, pm: false, eng: false, viewer: false },
    { action: 'Create/delete projects', admin: true, pm: false, eng: false, viewer: false },
    { action: 'Manage users & roles', admin: true, pm: false, eng: false, viewer: false },
    { action: 'Access settings & backup', admin: true, pm: true, eng: false, viewer: false },
  ];

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create accounts and assign roles · {users.length} users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGuideOpen(!guideOpen)}>
            <Info size={14} className="mr-1.5" /> Role Guide
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus size={14} className="mr-1.5" /> Create User
          </Button>
        </div>
      </div>

      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <CollapsibleContent>
          <div className="bg-card rounded-xl border shadow-sm p-5 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Role Permissions Guide
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Permission</th>
                    <th className="text-center py-2 px-3 font-medium"><Badge variant="outline" className={ROLE_COLORS.admin}>Admin</Badge></th>
                    <th className="text-center py-2 px-3 font-medium"><Badge variant="outline" className={ROLE_COLORS.project_manager}>PM</Badge></th>
                    <th className="text-center py-2 px-3 font-medium"><Badge variant="outline" className={ROLE_COLORS.engineer}>Engineer</Badge></th>
                    <th className="text-center py-2 px-3 font-medium"><Badge variant="outline" className={ROLE_COLORS.viewer}>Viewer</Badge></th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr key={p.action} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-foreground">{p.action}</td>
                      {[p.admin, p.pm, p.eng, p.viewer].map((allowed, i) => (
                        <td key={i} className="text-center py-2 px-3">
                          {allowed
                            ? <CheckCircle2 size={15} className="inline text-emerald-500" />
                            : <XCircle size={15} className="inline text-muted-foreground/40" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 The first user to register becomes Admin. Admin-created users are auto-approved into the current project.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

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
