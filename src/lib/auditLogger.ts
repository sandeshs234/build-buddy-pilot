import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | "login_success"
  | "login_failed"
  | "signup_success"
  | "signup_failed"
  | "signout"
  | "password_reset_request"
  | "password_change"
  | "role_assigned"
  | "role_changed"
  | "user_created"
  | "user_deleted"
  | "oauth_login";

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
