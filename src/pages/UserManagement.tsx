import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { UserPlus, Shield, Trash2, Info, CheckCircle2, XCircle, Trash, Loader2, UserCheck, FolderPlus, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

type AppRole = 'admin' | 'project_manager' | 'engineer' | 'viewer';

interface ProjectMembership {
  project_id: string;
  project_name: string;
  role: string;
  status: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  company: string;
  role: AppRole;
  memberships: ProjectMembership[];
}

interface ProjectOption {
  id: string;
  name: string;
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

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function UserManagement() {
  const { isAdmin, currentProjectId, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<UserRow | null>(null);
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignRole, setAssignRole] = useState('member');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const fetchUsers = async () => {
    const [{ data: profiles }, { data: roles }, { data: members }, { data: projectList }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('project_members').select('project_id, user_id, role, status'),
      supabase.from('projects').select('id, name'),
    ]);
    if (!profiles || !roles) return;

    const projectMap = new Map((projectList || []).map((p: any) => [p.id, p.name]));
    setProjects((projectList || []).map((p: any) => ({ id: p.id, name: p.name })));

    const roleMap = new Map(roles.map((r: any) => [r.user_id, r.role as AppRole]));
    const membersByUser = new Map<string, ProjectMembership[]>();
    (members || []).forEach((m: any) => {
      const list = membersByUser.get(m.user_id) || [];
      list.push({
        project_id: m.project_id,
        project_name: projectMap.get(m.project_id) || 'Unknown',
        role: m.role,
        status: m.status,
      });
      membersByUser.set(m.user_id, list);
    });

    setUsers(profiles.map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      company: p.company || '',
      role: roleMap.get(p.id) || 'viewer',
      memberships: membersByUser.get(p.id) || [],
    })));
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- Handlers ---

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || newPassword.length < 6) {
      toast({ title: 'Fill all fields (min 6 char password)', variant: 'destructive' });
      return;
    }
    setLoading(true);
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

  const handleDeleteUser = async (user: UserRow) => {
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_ids: [user.id] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'User Deleted', description: `${user.email} has been removed.` });
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAll = async () => {
    const nonAdminUsers = users.filter(u => u.id !== currentUser?.id);
    if (nonAdminUsers.length === 0) {
      toast({ title: 'No users to remove' });
      setClearAllOpen(false);
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_ids: nonAdminUsers.map(u => u.id) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Users Removed', description: `${data.deleted} user(s) deleted.` });
      setClearAllOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Clear Failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_ids: ids },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Users Deleted', description: `${data.deleted} user(s) removed.` });
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Bulk Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveMember = async (userId: string, projectId: string) => {
    const { error } = await supabase
      .from('project_members')
      .update({ status: 'approved' })
      .eq('user_id', userId)
      .eq('project_id', projectId);
    if (error) {
      toast({ title: 'Approve Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User Approved', description: 'Member now has access to the project.' });
      fetchUsers();
    }
  };

  const handleRejectMember = async (userId: string, projectId: string) => {
    const { error } = await supabase
      .from('project_members')
      .update({ status: 'rejected' })
      .eq('user_id', userId)
      .eq('project_id', projectId);
    if (error) {
      toast({ title: 'Reject Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User Rejected' });
      fetchUsers();
    }
  };

  const handleAssignToProject = async () => {
    if (!assignTarget || !assignProjectId) return;
    setLoading(true);
    // Check if membership already exists
    const { data: existing } = await supabase
      .from('project_members')
      .select('id, status')
      .eq('user_id', assignTarget.id)
      .eq('project_id', assignProjectId)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        toast({ title: 'Already a member', description: 'User is already assigned to this project.' });
      } else {
        // Update to approved
        await supabase.from('project_members').update({ status: 'approved', role: assignRole }).eq('id', existing.id);
        toast({ title: 'Membership Updated', description: 'User approved for the project.' });
        fetchUsers();
      }
    } else {
      const { error } = await supabase.from('project_members').insert({
        user_id: assignTarget.id,
        project_id: assignProjectId,
        role: assignRole,
        status: 'approved',
      });
      if (error) {
        toast({ title: 'Assign Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'User Assigned', description: `${assignTarget.email} added to project.` });
        fetchUsers();
      }
    }
    setLoading(false);
    setAssignDialogOpen(false);
    setAssignTarget(null);
    setAssignProjectId('');
    setAssignRole('member');
  };

  // --- Computed ---
  const selectableUsers = users.filter(u => u.id !== currentUser?.id);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedIds.has(u.id));
  const pendingCount = users.reduce((sum, u) => sum + u.memberships.filter(m => m.status === 'pending').length, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map(u => u.id)));
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
          <p className="text-sm text-muted-foreground mt-1">
            Create accounts and assign roles · {users.length} users
            {pendingCount > 0 && (
              <Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Clock size={12} className="mr-1" /> {pendingCount} pending
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} className="mr-1.5" /> Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" onClick={() => setGuideOpen(!guideOpen)}>
            <Info size={14} className="mr-1.5" /> Role Guide
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setClearAllOpen(true)} disabled={selectableUsers.length === 0}>
            <Trash size={14} className="mr-1.5" /> Clear All Users
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

      {/* User Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Project Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isSelf = u.id === currentUser?.id;
                const pendingMemberships = u.memberships.filter(m => m.status === 'pending');
                const approvedMemberships = u.memberships.filter(m => m.status === 'approved');
                return (
                  <tr key={u.id} className={selectedIds.has(u.id) ? 'bg-primary/5' : ''}>
                    <td>
                      {isSelf ? <span className="text-xs text-muted-foreground">You</span> : (
                        <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} aria-label={`Select ${u.email}`} />
                      )}
                    </td>
                    <td className="font-medium">{u.full_name || '—'}</td>
                    <td className="text-sm">{u.email}</td>
                    <td>
                      <Badge variant="outline" className={ROLE_COLORS[u.role]}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {pendingMemberships.map(m => (
                          <div key={m.project_id} className="flex items-center gap-1.5">
                            <Badge variant="outline" className={STATUS_COLORS.pending}>
                              <Clock size={10} className="mr-1" /> {m.project_name}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => handleApproveMember(u.id, m.project_id)}
                              title="Approve"
                            >
                              <CheckCircle2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => handleRejectMember(u.id, m.project_id)}
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </Button>
                          </div>
                        ))}
                        {approvedMemberships.map(m => (
                          <Badge key={m.project_id} variant="outline" className={STATUS_COLORS.approved}>
                            <CheckCircle2 size={10} className="mr-1" /> {m.project_name}
                          </Badge>
                        ))}
                        {u.memberships.length === 0 && (
                          <span className="text-xs text-muted-foreground">No project</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Select value={u.role} onValueChange={(v) => handleChangeRole(u.id, v as AppRole)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="project_manager">Project Manager</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        {!isSelf && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              onClick={() => { setAssignTarget(u); setAssignDialogOpen(true); }}
                              title="Assign to project"
                            >
                              <FolderPlus size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => { setDeleteTarget(u); setConfirmDeleteOpen(true); }}
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Dialog */}
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

      {/* Assign to Project Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign to Project</DialogTitle>
            <DialogDescription>
              Assign <strong>{assignTarget?.email}</strong> to a project with a specific role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project</Label>
              <Select value={assignProjectId} onValueChange={setAssignProjectId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No projects available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project Role</Label>
              <Select value={assignRole} onValueChange={setAssignRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="co_admin">Co-Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignToProject} disabled={loading || !assignProjectId}>
              {loading ? <><Loader2 size={14} className="mr-1 animate-spin" /> Assigning...</> : <><UserCheck size={14} className="mr-1" /> Assign</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single User Confirmation */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.email}</strong> and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDeleteUser(deleteTarget)} disabled={deleting}>
              {deleting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Deleting...</> : <><Trash2 size={14} className="mr-1" /> Delete User</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Users Confirmation */}
      <Dialog open={clearAllOpen} onOpenChange={setClearAllOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove All Other Users?</DialogTitle>
            <DialogDescription>
              This will permanently delete {users.filter(u => u.id !== currentUser?.id).length} user(s). Your admin account will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            ⚠️ All user profiles, roles, and project memberships will be removed.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearAllOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={deleting}>
              {deleting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Removing...</> : <><Trash size={14} className="mr-1" /> Remove All Users</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} User(s)?</DialogTitle>
            <DialogDescription>
              This will permanently remove the selected users and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            ⚠️ {users.filter(u => selectedIds.has(u.id)).map(u => u.email).join(', ')}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? <><Loader2 size={14} className="mr-1 animate-spin" /> Deleting...</> : <><Trash2 size={14} className="mr-1" /> Delete Selected</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
