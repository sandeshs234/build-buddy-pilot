import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();
    if (callerRole?.role !== "admin") throw new Error("Admin access required");

    const { email, password, full_name, role, project_id } = await req.json();

    // Create user with service role (bypasses signup disabled)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createError) throw createError;

    // Update role if not default viewer
    if (role && role !== "viewer" && newUser.user) {
      await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUser.user.id);
    }

    // Auto-approve into admin's current project if provided
    if (project_id && newUser.user) {
      await supabase
        .from("project_members")
        .insert({
          project_id,
          user_id: newUser.user.id,
          role: "member",
          status: "approved",
        });
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      event_type: "user_created",
      user_id: caller.id,
      event_data: { created_user_id: newUser.user?.id, email, role: role || "viewer" },
      status: "success",
    });

    return new Response(JSON.stringify({ success: true, user_id: newUser.user?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
