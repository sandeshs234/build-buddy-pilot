import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "signup"
  | "password_reset_request"
  | "password_reset_complete"
  | "password_change"
  | "role_assigned"
  | "role_changed"
  | "user_created"
  | "user_deleted"
  | "profile_updated"
  | "oauth_login_success"
  | "oauth_login_failed"
  | "session_expired"
  | "mfa_enabled"
  | "mfa_disabled";

interface AuditLogParams {
  event_type: AuditEventType;
  event_data?: Record<string, unknown>;
  user_id?: string;
  status?: "success" | "failure";
  error_message?: string;
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    await supabase.functions.invoke("log-audit-event", {
      body: {
        event_type: params.event_type,
        event_data: params.event_data || {},
        user_id: params.user_id || null,
        status: params.status || "success",
        error_message: params.error_message || null,
        user_agent: navigator.userAgent,
      },
    });
  } catch {
    // Silently fail — audit logging should never break the app
    console.warn("Audit log failed");
  }
}
