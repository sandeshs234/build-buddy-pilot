import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CalendarClock, ClipboardList, Ruler, Package, ShoppingCart, 
  Receipt, Users, UserCog, Truck, Droplets, ShieldCheck, AlertTriangle, 
  HardHat, Flame, Wrench, Building2, Camera, Clock, Settings, Database, 
  BarChart3, HelpCircle, FileText, FileDiff, ChevronDown, ChevronRight,
  Construction, FileSpreadsheet, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SampleTemplates from '@/components/SampleTemplates';
import AIAssistant from '@/components/AIAssistant';

interface NavGroup {
  label: string;
  items: { label: string; path: string; icon: React.ReactNode }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Activities (CPM)', path: '/activities', icon: <CalendarClock size={18} /> },
      { label: 'BOQ / Items', path: '/boq', icon: <ClipboardList size={18} /> },
      { label: 'Change Orders', path: '/change-orders', icon: <FileDiff size={18} /> },
    ],
  },
  {
    label: 'Daily Logs',
    items: [
      { label: 'Daily Quantity', path: '/daily-quantity', icon: <Ruler size={18} /> },
      { label: 'Manpower', path: '/manpower', icon: <Users size={18} /> },
      { label: 'Equipment', path: '/equipment', icon: <Truck size={18} /> },
      { label: 'Fuel Log', path: '/fuel', icon: <Droplets size={18} /> },
      { label: 'Concrete Pour', path: '/concrete', icon: <Building2 size={18} /> },
      { label: 'Welding', path: '/welding', icon: <Flame size={18} /> },
    ],
  },
  {
    label: 'Quality & Safety',
    items: [
      { label: 'Quality (ITP/NCR)', path: '/quality', icon: <ShieldCheck size={18} /> },
      { label: 'Safety', path: '/safety', icon: <HardHat size={18} /> },
    ],
  },
  {
    label: 'Procurement',
    items: [
      { label: 'Inventory', path: '/inventory', icon: <Package size={18} /> },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={18} /> },
      { label: 'Bills', path: '/bills', icon: <Receipt size={18} /> },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Key Staff', path: '/staff', icon: <UserCog size={18} /> },
      { label: 'Subcontractors', path: '/subcontractors', icon: <Construction size={18} /> },
      { label: 'Tools', path: '/tools', icon: <Wrench size={18} /> },
    ],
  },
  {
    label: 'Documentation',
    items: [
      { label: 'Photos', path: '/photos', icon: <Camera size={18} /> },
      { label: 'Documents', path: '/documents', icon: <FileText size={18} /> },
      { label: 'Delays', path: '/delays', icon: <Clock size={18} /> },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
      { label: 'Backup / Restore', path: '/backup', icon: <Database size={18} /> },
      { label: 'Help', path: '/help', icon: <HelpCircle size={18} /> },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border overflow-hidden">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Construction size={20} className="text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">BuildForge</h1>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Construction PM</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-2 border-b border-sidebar-border flex gap-1.5">
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
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            'sidebar-item',
                            active ? 'sidebar-item-active' : 'sidebar-item-inactive'
                          )}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      {/* Global Dialogs */}
      <SampleTemplates open={templatesOpen} onOpenChange={setTemplatesOpen} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
