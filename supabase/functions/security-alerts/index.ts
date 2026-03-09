import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Alert thresholds
const FAILED_LOGIN_THRESHOLD = 5; // failed logins per user in window
const FAILED_LOGIN_WINDOW_MINUTES = 15;
const ROLE_ESCALATION_EVENTS = ["role_changed", "user_created", "user_deleted"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const windowStart = new Date(now.getTime() - FAILED_LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
    const alerts: Array<{ title: string; message: string; type: string }> = [];

    // 1. Check for brute-force login attempts (multiple failed logins per email)
    const { data: failedLogins } = await supabase
      .from("audit_logs")
      .select("event_data, user_id, created_at")
      .eq("event_type", "login_failed")
      .eq("status", "failure")
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false });

    if (failedLogins && failedLogins.length > 0) {
      // Group by email from event_data
      const emailCounts: Record<string, number> = {};
      for (const log of failedLogins) {
        const email = (log.event_data as any)?.email || "unknown";
        emailCounts[email] = (emailCounts[email] || 0) + 1;
      }

      for (const [email, count] of Object.entries(emailCounts)) {
        if (count >= FAILED_LOGIN_THRESHOLD) {
          alerts.push({
            title: "🚨 Brute-Force Login Detected",
            message: `${count} failed login attempts for "${email}" in the last ${FAILED_LOGIN_WINDOW_MINUTES} minutes. Possible brute-force attack.`,
            type: "security",
          });
        }
      }
    }

    // 2. Check for recent role changes (potential privilege escalation)
    const { data: roleChanges } = await supabase
      .from("audit_logs")
      .select("event_type, event_data, user_id, created_at")
      .in("event_type", ROLE_ESCALATION_EVENTS)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: false });

    if (roleChanges && roleChanges.length > 0) {
      for (const change of roleChanges) {
        const data = change.event_data as any;
        if (change.event_type === "role_changed") {
          const newRole = data?.new_role || "unknown";
          if (newRole === "admin" || newRole === "project_manager") {
            alerts.push({
              title: "⚠️ Privilege Escalation",
              message: `User role changed to "${newRole}" for user ${data?.target_user_id || "unknown"} by admin ${change.user_id}.`,
              type: "security",
            });
          }
        }
        if (change.event_type === "user_deleted") {
          const count = data?.success_count || 0;
          alerts.push({
            title: "⚠️ Users Deleted",
            message: `${count} user(s) were deleted by admin ${change.user_id}.`,
            type: "security",
          });
        }
      }
    }

    // 3. Check for unusual signup volume (potential spam)
    const { data: signups } = await supabase
      .from("audit_logs")
      .select("id")
      .eq("event_type", "signup")
      .gte("created_at", windowStart);

    if (signups && signups.length >= 10) {
      alerts.push({
        title: "⚠️ Signup Spike Detected",
        message: `${signups.length} new signups in the last ${FAILED_LOGIN_WINDOW_MINUTES} minutes. Possible spam registration.`,
        type: "security",
      });
    }

    // Send notifications to all admin users
    if (alerts.length > 0) {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const notifications = [];
        for (const admin of adminRoles) {
          for (const alert of alerts) {
            notifications.push({
              user_id: admin.user_id,
              title: alert.title,
              message: alert.message,
              type: alert.type,
            });
          }
        }
        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({ success: true, alerts_sent: alerts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Security alerts error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
