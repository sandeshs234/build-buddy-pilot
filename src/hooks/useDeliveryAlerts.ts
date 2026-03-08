import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ALERT_CACHE_KEY = 'buildforge_delivery_alerts_last';
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function useDeliveryAlerts() {
  const { user, currentProjectId } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;

    // Throttle: only check every 4 hours
    const lastCheck = localStorage.getItem(ALERT_CACHE_KEY);
    if (lastCheck && Date.now() - parseInt(lastCheck) < CHECK_INTERVAL_MS) return;

    hasRun.current = true;
    checkDeliveryDates(user.id, currentProjectId);
  }, [user, currentProjectId]);
}

async function checkDeliveryDates(userId: string, projectId: string | null) {
  try {
    const { data: items } = await supabase
      .from('procurement_tracking')
      .select('id, material_description, expected_delivery, actual_delivery, status')
      .neq('status', 'received');

    if (!items || items.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    const alerts: { title: string; message: string; type: string }[] = [];

    for (const item of items) {
      if (!item.expected_delivery || item.actual_delivery) continue;

      const expected = new Date(item.expected_delivery);
      expected.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expected.getTime() - today.getTime()) / 86400000);

      if (diffDays < 0) {
        // Overdue
        alerts.push({
          title: `⚠️ Overdue: ${item.material_description}`,
          message: `Delivery is ${Math.abs(diffDays)} day(s) overdue. Expected: ${item.expected_delivery}. Update status in Procurement Tracking.`,
          type: 'procurement',
        });
      } else if (diffDays <= 3) {
        // Approaching (within 3 days)
        alerts.push({
          title: `📦 Delivery Soon: ${item.material_description}`,
          message: `Expected delivery in ${diffDays === 0 ? 'today' : `${diffDays} day(s)`} (${item.expected_delivery}). Coordinate with supplier.`,
          type: 'procurement',
        });
      }
    }

    if (alerts.length === 0) {
      localStorage.setItem(ALERT_CACHE_KEY, String(Date.now()));
      return;
    }

    // Check existing notifications to avoid duplicates (same title today)
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: existing } = await (supabase as any)
      .from('notifications')
      .select('title')
      .eq('user_id', userId)
      .gte('created_at', `${todayStr}T00:00:00`)
      .eq('type', 'procurement');

    const existingTitles = new Set((existing || []).map((n: any) => n.title));

    const newAlerts = alerts.filter(a => !existingTitles.has(a.title));

    if (newAlerts.length > 0) {
      const rows = newAlerts.map(a => ({
        user_id: userId,
        project_id: projectId,
        title: a.title,
        message: a.message,
        type: a.type,
      }));
      await (supabase as any).from('notifications').insert(rows);
    }

    localStorage.setItem(ALERT_CACHE_KEY, String(Date.now()));
  } catch (err) {
    console.error('Delivery alert check failed:', err);
  }
}
