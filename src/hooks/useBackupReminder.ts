import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export function useBackupReminder() {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    const checkBackup = () => {
      const last = localStorage.getItem('buildforge_last_backup');
      if (!last) {
        toast({
          title: '⚠️ No Local Backup Found',
          description: 'You haven\'t created a local backup yet. Go to Settings → Backup to download one.',
          duration: 10000,
        });
        shown.current = true;
        return;
      }

      const lastDate = new Date(last).getTime();
      if (Date.now() - lastDate > TWO_DAYS_MS) {
        const daysAgo = Math.floor((Date.now() - lastDate) / (24 * 60 * 60 * 1000));
        toast({
          title: '⚠️ Backup Overdue',
          description: `Your last local backup was ${daysAgo} day(s) ago. Go to Settings → Backup to create a new one.`,
          duration: 10000,
        });
        shown.current = true;
      }
    };

    // Delay check so it doesn't fire during initial load
    const timer = setTimeout(checkBackup, 5000);
    return () => clearTimeout(timer);
  }, []);
}
