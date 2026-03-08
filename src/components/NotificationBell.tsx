import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    // Subscribe to realtime
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`,
      }, () => fetchNotifications())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNavigationPath = (type: string): string => {
    switch (type) {
      case 'join_request':
      case 'approved':
      case 'rejected':
        return '/projects';
      case 'data_approval':
      case 'data_approved':
      case 'data_rejected':
        return '/dashboard';
      case 'activity':
      case 'schedule':
        return '/activities';
      case 'boq':
        return '/boq';
      case 'inventory':
      case 'low_inventory':
        return '/inventory';
      case 'safety':
        return '/safety';
      case 'delay':
        return '/delays';
      case 'equipment':
        return '/equipment';
      case 'manpower':
        return '/manpower';
      case 'purchase_order':
        return '/purchase-orders';
      case 'quality':
        return '/quality';
      case 'concrete':
        return '/concrete';
      case 'welding':
        return '/welding';
      case 'fuel':
        return '/fuel';
      case 'daily_quantity':
        return '/daily-quantity';
      default:
        return '/dashboard';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
    navigate(getNavigationPath(notification.type));
    setOpen(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await (supabase as any)
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'join_request': return 'bg-amber-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
           {notifications.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
           ) : (
             notifications.map(n => (
               <button
                 key={n.id}
                 onClick={() => handleNotificationClick(n)}
                 className={cn('w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted transition-colors', !n.read && 'bg-muted/50')}
               >
                 <div className="flex items-start gap-2">
                   <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', getTypeColor(n.type))} />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium">{n.title}</p>
                     <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                     <p className="text-[10px] text-muted-foreground/60 mt-1">
                       {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                     </p>
                   </div>
                 </div>
               </button>
             ))
           )}
         </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
