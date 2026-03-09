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

    const { user_ids } = await req.json();
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      throw new Error("user_ids array is required");
    }

    // Prevent admin from deleting themselves
    if (user_ids.includes(caller.id)) {
      throw new Error("Cannot delete your own account");
    }

    const results = [];
    for (const userId of user_ids) {
      // Delete from profiles, user_roles, project_members (cascade should handle some)
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("project_members").delete().eq("user_id", userId);
      await supabase.from("notifications").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        results.push({ user_id: userId, success: false, error: error.message });
      } else {
        results.push({ user_id: userId, success: true });
      }
    }

    await supabase.from("audit_logs").insert({
      event_type: "user_deleted",
      user_id: caller.id,
      event_data: { deleted_user_ids: user_ids, success_count: successCount },
      status: "success",
    });

    const successCount2 = results.filter(r => r.success).length;
    return new Response(JSON.stringify({ success: true, deleted: successCount, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
