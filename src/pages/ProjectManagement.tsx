import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Copy, Users, Shield, ShieldCheck, UserPlus, Check, X, Crown } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  connection_code: string;
  created_by: string;
  created_at: string;
}

interface Member {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  profile?: { full_name: string; email: string };
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ProjectManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    // Get projects where user is creator or member
    const { data: memberRows } = await (supabase as any)
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    const projectIds = memberRows?.map((m: any) => m.project_id) || [];

    const { data: createdProjects } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('created_by', user.id);

    const { data: memberProjects } = projectIds.length > 0
      ? await (supabase as any).from('projects').select('*').in('id', projectIds)
      : { data: [] };

    const all = [...(createdProjects || []), ...(memberProjects || [])];
    const unique = Array.from(new Map(all.map((p: Project) => [p.id, p])).values());
    setProjects(unique);

    // Fetch members for each project
    for (const p of unique) {
      const { data: mems } = await (supabase as any)
        .from('project_members')
        .select('*')
        .eq('project_id', p.id);

      if (mems) {
        // Fetch profiles for each member
        const userIds = mems.map((m: any) => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const enriched = mems.map((m: any) => ({
          ...m,
          profile: profiles?.find((pr) => pr.id === m.user_id),
        }));
        setMembers(prev => ({ ...prev, [p.id]: enriched }));
      }
    }
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const createProject = async () => {
    if (!user || !newName.trim()) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await (supabase as any)
      .from('projects')
      .insert({ name: newName, description: newDesc, connection_code: code, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Add creator as admin member
      await (supabase as any)
        .from('project_members')
        .insert({ project_id: data.id, user_id: user.id, role: 'admin', status: 'approved' });

      toast({ title: 'Project created!', description: `Connection code: ${code}` });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      await refreshMemberships();
      fetchProjects();
    }
    setLoading(false);
  };

  const joinProject = async () => {
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    const { data: project } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('connection_code', joinCode.toUpperCase().trim())
      .single();

    if (!project) {
      toast({ title: 'Invalid code', description: 'No project found with this code.', variant: 'destructive' });
    } else {
      const { error } = await (supabase as any)
        .from('project_members')
        .insert({ project_id: project.id, user_id: user.id, role: 'member', status: 'pending' });

      if (error?.code === '23505') {
        toast({ title: 'Already joined', description: 'You are already a member of this project.' });
      } else if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Request sent!', description: 'Waiting for admin approval.' });
      }
      setJoinOpen(false);
      setJoinCode('');
      fetchProjects();
    }
    setLoading(false);
  };

  const approveMember = async (memberId: string) => {
    await (supabase as any).from('project_members').update({ status: 'approved' }).eq('id', memberId);
    toast({ title: 'Member approved' });
    fetchProjects();
  };

  const rejectMember = async (memberId: string) => {
    await (supabase as any).from('project_members').update({ status: 'rejected' }).eq('id', memberId);
    toast({ title: 'Member rejected' });
    fetchProjects();
  };

  const toggleCoAdmin = async (member: Member, projectId: string) => {
    const projectMembers = members[projectId] || [];
    const coAdminCount = projectMembers.filter(m => m.role === 'co_admin').length;

    if (member.role === 'member' && coAdminCount >= 3) {
      toast({ title: 'Limit reached', description: 'Maximum 3 co-admins allowed.', variant: 'destructive' });
      return;
    }

    const newRole = member.role === 'co_admin' ? 'member' : 'co_admin';
    await (supabase as any).from('project_members').update({ role: newRole }).eq('id', member.id);
    toast({ title: `Role updated to ${newRole.replace('_', '-')}` });
    fetchProjects();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Connection code copied to clipboard.' });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-amber-500/20 text-amber-700 border-amber-300"><Crown size={12} className="mr-1" /> Admin</Badge>;
      case 'co_admin': return <Badge className="bg-blue-500/20 text-blue-700 border-blue-300"><ShieldCheck size={12} className="mr-1" /> Co-Admin</Badge>;
      default: return <Badge variant="secondary"><Users size={12} className="mr-1" /> Member</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Create or join projects and manage team members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinOpen(true)}>
            <UserPlus size={16} className="mr-1" /> Join Project
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" /> Create Project
          </Button>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <Shield size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a new project or join one with a connection code.</p>
        </div>
      )}

      <div className="grid gap-4">
        {projects.map(project => {
          const projectMembers = members[project.id] || [];
          const isAdmin = project.created_by === user?.id || projectMembers.find(m => m.user_id === user?.id)?.role === 'admin';
          const isCoAdmin = projectMembers.find(m => m.user_id === user?.id)?.role === 'co_admin';
          const pendingMembers = projectMembers.filter(m => m.status === 'pending');
          const approvedMembers = projectMembers.filter(m => m.status === 'approved');

          return (
            <div key={project.id} className="bg-card rounded-xl border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
                </div>
                {(isAdmin || isCoAdmin) && (
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
                    <code className="text-sm font-mono font-bold text-foreground">{project.connection_code}</code>
                    <button onClick={() => copyCode(project.connection_code)} className="text-muted-foreground hover:text-foreground">
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Pending approvals */}
              {(isAdmin || isCoAdmin) && pendingMembers.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-300/30 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium text-amber-700">Pending Approval ({pendingMembers.length})</h4>
                  {pendingMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-card rounded-md px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{m.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => approveMember(m.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectMember(m.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Members */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Team Members ({approvedMembers.length})</h4>
                <div className="grid gap-1.5">
                  {approvedMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {m.profile?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.profile?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(m.role)}
                        {isAdmin && m.role !== 'admin' && m.user_id !== user?.id && (
                          <Button size="sm" variant="ghost" onClick={() => toggleCoAdmin(m, project.id)} className="text-xs">
                            {m.role === 'co_admin' ? 'Remove Co-Admin' : 'Make Co-Admin'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Tower Block A" className="mt-1.5" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createProject} disabled={loading || !newName.trim()}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Project Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a Project</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Connection Code</Label>
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="mt-1.5 font-mono text-center text-lg tracking-widest"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground mt-2">Ask your project admin for the connection code.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button onClick={joinProject} disabled={loading || joinCode.length < 8}>
              {loading ? 'Joining...' : 'Request to Join'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
