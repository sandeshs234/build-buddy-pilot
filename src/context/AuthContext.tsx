import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'project_manager' | 'engineer' | 'viewer';
type StorageMode = 'local' | 'cloud' | null;

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  avatar_url: string;
  storage_mode: string | null;
}

interface ProjectMembership {
  project_id: string;
  role: string; // 'admin' | 'co_admin' | 'member'
  status: string;
  project_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  storageMode: StorageMode;
  setStorageMode: (mode: 'local' | 'cloud') => Promise<void>;
  signOut: () => Promise<void>;
  // Project context
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  projectRole: string | null; // 'admin' | 'co_admin' | 'member'
  projectMemberships: ProjectMembership[];
  isProjectAdmin: boolean;
  isProjectCoAdmin: boolean;
  canApprove: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageModeState] = useState<StorageMode>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    try { return localStorage.getItem('buildforge_current_project'); } catch { return null; }
  });
  const [projectMemberships, setProjectMemberships] = useState<ProjectMembership[]>([]);

  const fetchProfileAndRole = async (userId: string) => {
    const [profileRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);
    if (profileRes.data) {
      const p = profileRes.data as Profile;
      setProfile(p);
      setStorageModeState((p.storage_mode as StorageMode) || null);
    }
    if (roleRes.data) setRole(roleRes.data.role as AppRole);

    // Fetch project memberships
    const { data: memberships } = await (supabase as any)
      .from('project_members')
      .select('project_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (memberships && memberships.length > 0) {
      // Fetch project names
      const projectIds = memberships.map((m: any) => m.project_id);
      const { data: projects } = await (supabase as any)
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      const enriched = memberships.map((m: any) => ({
        ...m,
        project_name: projects?.find((p: any) => p.id === m.project_id)?.name || 'Unknown',
      }));
      setProjectMemberships(enriched);

      // Auto-select first project if none selected
      if (!currentProjectId && enriched.length > 0) {
        setCurrentProjectId(enriched[0].project_id);
        try { localStorage.setItem('buildforge_current_project', enriched[0].project_id); } catch {}
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfileAndRole(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setStorageModeState(null);
          setProjectMemberships([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetCurrentProjectId = (id: string | null) => {
    setCurrentProjectId(id);
    try {
      if (id) localStorage.setItem('buildforge_current_project', id);
      else localStorage.removeItem('buildforge_current_project');
    } catch {}
  };

  const setStorageMode = async (mode: 'local' | 'cloud') => {
    setStorageModeState(mode);
    if (user) {
      await supabase.from('profiles').update({ storage_mode: mode } as any).eq('id', user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setStorageModeState(null);
    setProjectMemberships([]);
  };

  const currentMembership = projectMemberships.find(m => m.project_id === currentProjectId);
  const projectRole = currentMembership?.role || null;
  const isProjectAdmin = projectRole === 'admin';
  const isProjectCoAdmin = projectRole === 'co_admin';
  const canApprove = isProjectAdmin || isProjectCoAdmin;

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      isAdmin: role === 'admin',
      storageMode,
      setStorageMode,
      signOut,
      currentProjectId,
      setCurrentProjectId: handleSetCurrentProjectId,
      projectRole,
      projectMemberships,
      isProjectAdmin,
      isProjectCoAdmin,
      canApprove,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
