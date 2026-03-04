import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "critical-path") {
      systemPrompt = `You are a construction project scheduling expert. Analyze the provided activities and:
1. Identify the critical path (longest sequence of dependent activities)
2. Calculate float/slack for non-critical activities
3. Flag activities that are behind schedule
4. Suggest dependency relationships (FS, SS, FF, SF) between activities that don't have predecessors
5. Recommend schedule recovery actions for delayed activities

Return a JSON response with this structure:
{
  "criticalPath": ["activity_id1", "activity_id2"],
  "floatAnalysis": [{"id": "activity_id", "totalFloat": 5, "freeFloat": 3}],
  "behindSchedule": [{"id": "activity_id", "daysLate": 3, "reason": "..."}],
  "suggestedDependencies": [{"from": "wbs1", "to": "wbs2", "type": "FS", "reason": "..."}],
  "recoveryActions": [{"activity": "name", "action": "...", "priority": "high"}],
  "summary": "Brief overall analysis"
}`;
      userPrompt = `Analyze these construction activities:\n${JSON.stringify(data.activities, null, 2)}\n\nToday's date: ${new Date().toISOString().split('T')[0]}`;
    } else if (action === "schedule-optimize") {
      systemPrompt = `You are a construction scheduling optimizer. Given the activities, suggest optimizations to reduce project duration, level resources, and improve efficiency. Return practical, actionable suggestions.`;
      userPrompt = `Optimize this schedule:\n${JSON.stringify(data.activities, null, 2)}`;
    } else if (action === "general") {
      systemPrompt = `You are BuildForge AI, an expert construction project management assistant. Help with scheduling, BOQ analysis, cost control, safety, quality management, and all aspects of construction project management. Be concise, practical, and data-driven. When analyzing data, reference specific items by their codes/IDs.`;
      userPrompt = data.message;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
