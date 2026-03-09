import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarClock, ClipboardList, Ruler, Package, ShoppingCart, 
  Receipt, Users, UserCog, Truck, Droplets, ShieldCheck, AlertTriangle, 
  HardHat, Flame, Wrench, Building2, Camera, Clock, Settings, Database, 
  BarChart3, HelpCircle, FileText, FileDiff, ChevronDown, ChevronRight,
  Construction, FileSpreadsheet, Bot, LogOut, Shield, FolderKanban, Menu, X, TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SampleTemplates from '@/components/SampleTemplates';
import AIAssistant from '@/components/AIAssistant';
import ProjectChat from '@/components/ProjectChat';
import NotificationBell from '@/components/NotificationBell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDeliveryAlerts } from '@/hooks/useDeliveryAlerts';
import { useBackupReminder } from '@/hooks/useBackupReminder';

type AppRole = 'admin' | 'project_manager' | 'engineer' | 'viewer' | 'accountant' | 'safety_officer' | 'store_keeper' | 'surveyor';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles?: AppRole[]; // if set, only these roles see this item
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Roles that have full access (see everything)
const FULL_ACCESS_ROLES: AppRole[] = ['admin', 'project_manager'];

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Projects', path: '/projects', icon: <FolderKanban size={18} /> },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Activities (CPM)', path: '/activities', icon: <CalendarClock size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'surveyor'] },
      { label: 'BOQ / Items', path: '/boq', icon: <ClipboardList size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'surveyor', 'accountant'] },
      { label: 'Change Orders', path: '/change-orders', icon: <FileDiff size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'accountant'] },
    ],
  },
  {
    label: 'Daily Logs',
    items: [
      { label: 'Daily Quantity', path: '/daily-quantity', icon: <Ruler size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'surveyor'] },
      { label: 'Manpower', path: '/manpower', icon: <Users size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'safety_officer'] },
      { label: 'Equipment', path: '/equipment', icon: <Truck size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'store_keeper'] },
      { label: 'Fuel Log', path: '/fuel', icon: <Droplets size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'store_keeper'] },
      { label: 'Concrete Pour', path: '/concrete', icon: <Building2 size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'surveyor'] },
      { label: 'Welding', path: '/welding', icon: <Flame size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer'] },
    ],
  },
  {
    label: 'Quality & Safety',
    items: [
      { label: 'Quality (ITP/NCR)', path: '/quality', icon: <ShieldCheck size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'safety_officer'] },
      { label: 'Safety', path: '/safety', icon: <HardHat size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'safety_officer'] },
    ],
  },
  {
    label: 'Finance & Procurement',
    items: [
      { label: 'Inventory', path: '/inventory', icon: <Package size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'store_keeper', 'accountant'] },
      { label: 'Procurement Plan', path: '/procurement-plan', icon: <TrendingUp size={18} />, allowedRoles: ['admin', 'project_manager', 'store_keeper', 'accountant'] },
      { label: 'Procurement Tracker', path: '/procurement-tracker', icon: <Truck size={18} />, allowedRoles: ['admin', 'project_manager', 'store_keeper', 'accountant'] },
      { label: 'Supplier Performance', path: '/supplier-performance', icon: <BarChart3 size={18} />, allowedRoles: ['admin', 'project_manager', 'store_keeper', 'accountant'] },
      { label: 'Procurement Digest', path: '/procurement-digest', icon: <FileText size={18} />, allowedRoles: ['admin', 'project_manager', 'store_keeper', 'accountant'] },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'store_keeper', 'accountant'] },
      { label: 'Bills', path: '/bills', icon: <Receipt size={18} />, allowedRoles: ['admin', 'project_manager', 'accountant'] },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Key Staff', path: '/staff', icon: <UserCog size={18} />, allowedRoles: ['admin', 'project_manager'] },
      { label: 'Subcontractors', path: '/subcontractors', icon: <Construction size={18} />, allowedRoles: ['admin', 'project_manager', 'accountant'] },
      { label: 'Tools', path: '/tools', icon: <Wrench size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer', 'store_keeper'] },
    ],
  },
  {
    label: 'Documentation',
    items: [
      { label: 'Photos', path: '/photos', icon: <Camera size={18} /> },
      { label: 'Documents', path: '/documents', icon: <FileText size={18} /> },
      { label: 'Delays', path: '/delays', icon: <Clock size={18} />, allowedRoles: ['admin', 'project_manager', 'engineer'] },
      { label: 'Project Summary', path: '/project-summary', icon: <FileSpreadsheet size={18} />, allowedRoles: ['admin', 'project_manager', 'accountant'] },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, allowedRoles: ['admin', 'project_manager', 'accountant'] },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'User Management', path: '/users', icon: <Shield size={18} />, allowedRoles: ['admin'] },
      { label: 'Settings', path: '/settings', icon: <Settings size={18} />, allowedRoles: ['admin', 'project_manager'] },
      { label: 'Backup / Restore', path: '/backup', icon: <Database size={18} />, allowedRoles: ['admin', 'project_manager'] },
      { label: 'Help', path: '/help', icon: <HelpCircle size={18} /> },
    ],
  },
];

const ROLE_BADGE_COLORS: Partial<Record<AppRole, string>> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/30',
  project_manager: 'bg-primary/10 text-primary border-primary/30',
  engineer: 'bg-accent/50 text-accent-foreground border-accent',
  viewer: 'bg-muted text-muted-foreground border-muted-foreground/20',
  accountant: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  safety_officer: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  store_keeper: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  surveyor: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, signOut, currentProjectId, setCurrentProjectId, projectMemberships, projectRole } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  useDeliveryAlerts();
  useBackupReminder();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: memberData } = await supabase
        .from('project_members')
        .select('id')
        .eq('status', 'pending');
      setPendingMembersCount(memberData?.length || 0);

      const { data: changesData } = await supabase
        .from('data_changes')
        .select('id')
        .eq('status', 'pending');
      setPendingChangesCount(changesData?.length || 0);
    };

    fetchCounts();

    const membersSub = supabase
      .channel('project_members_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, () => fetchCounts())
      .subscribe();

    const changesSub = supabase
      .channel('data_changes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_changes' }, () => fetchCounts())
      .subscribe();

    return () => { membersSub.unsubscribe(); changesSub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const userRole = (role as AppRole) || 'viewer';

  const isItemVisible = (item: NavItem): boolean => {
    if (!item.allowedRoles) return true; // no restriction = visible to all
    return item.allowedRoles.includes(userRole);
  };

  const currentProjectName = projectMemberships.find(m => m.project_id === currentProjectId)?.project_name || 'No Project';
  const roleBadgeClass = ROLE_BADGE_COLORS[userRole] || ROLE_BADGE_COLORS.viewer;
  const roleLabel = userRole.replace(/_/g, ' ');

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Header Bar */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar flex items-center justify-between px-4 border-b border-sidebar-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Construction size={16} className="text-sidebar-primary-foreground" />
            </div>
            <h1 className="text-sm font-bold text-sidebar-foreground">BuildForge</h1>
          </div>
          <NotificationBell />
        </header>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border overflow-hidden transition-transform duration-300 ease-in-out z-50',
          isMobile ? 'fixed top-14 left-0 bottom-0 w-72 shadow-2xl' : 'w-64 relative',
          isMobile && !sidebarOpen && '-translate-x-full'
        )}
      >
        {/* Logo - only on desktop */}
        {!isMobile && (
          <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Construction size={20} className="text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">BuildForge</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Construction PM</p>
            </div>
          </div>
        )}

        {/* Project Selector */}
        {projectMemberships.length > 0 && (
          <div className="px-3 py-2 border-b border-sidebar-border">
            <Select value={currentProjectId || ''} onValueChange={(v) => setCurrentProjectId(v)}>
              <SelectTrigger className="w-full h-8 text-xs bg-sidebar-accent/50">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projectMemberships.map(m => (
                  <SelectItem key={m.project_id} value={m.project_id} className="text-xs">
                    {m.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectRole && (
              <p className="text-[10px] text-sidebar-foreground/50 mt-1 px-1 capitalize">
                Role: {projectRole.replace('_', ' ')}
              </p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-3 py-2 border-b border-sidebar-border flex gap-1.5">
          {!isMobile && <NotificationBell />}
          <button
            onClick={() => setAiOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium bg-sidebar-primary/20 text-sidebar-primary hover:bg-sidebar-primary/30 transition-colors"
          >
            <Bot size={13} /> AI Assist
          </button>
          <button
            onClick={() => setTemplatesOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
          >
            <FileSpreadsheet size={13} /> Templates
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsed[group.label];

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                >
                  {group.label}
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5 mb-2">
                    {visibleItems.map((item) => {
                       const active = location.pathname === item.path;
                       let badge: number | null = null;
                       
                       if (item.path === '/projects') badge = pendingMembersCount;
                       else if (item.path === '/dashboard') badge = pendingChangesCount;

                       return (
                         <Link
                           key={item.path}
                           to={item.path}
                           className={cn(
                             'sidebar-item',
                             active ? 'sidebar-item-active' : 'sidebar-item-inactive'
                           )}
                         >
                           <div className="flex items-center gap-3">
                             {item.icon}
                             <span>{item.label}</span>
                           </div>
                           {badge !== null && badge > 0 && (
                             <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex-shrink-0">
                               {badge > 99 ? '99+' : badge}
                             </span>
                           )}
                         </Link>
                       );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-[11px] font-bold text-sidebar-primary">
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{profile?.full_name || profile?.email || 'User'}</p>
              <Badge
                variant="outline"
                className={cn('text-[9px] px-1.5 py-0 h-4 mt-0.5 font-semibold uppercase tracking-wide', roleBadgeClass)}
              >
                {roleLabel}
              </Badge>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn('flex-1 overflow-y-auto', isMobile && 'pt-14')}>
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Global Dialogs */}
      <SampleTemplates open={templatesOpen} onOpenChange={setTemplatesOpen} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />

      {/* Project Chat */}
      {currentProjectId && (
        <ProjectChat projectId={currentProjectId} projectName={currentProjectName} />
      )}
    </div>
  );
}
