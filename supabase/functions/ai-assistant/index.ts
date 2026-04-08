import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULE_PROMPTS: Record<string, string> = {
  activities: `You are a CPM scheduling expert. Analyze activities for critical path, float, delays, and resource leveling. Suggest dependency optimizations and recovery plans.`,
  boq: `You are a BOQ/quantity surveying expert. Analyze bill of quantities for cost trends, over/under-execution, rate anomalies, and budget forecasting. Flag items with low execution vs plan.`,
  inventory: `You are an inventory management expert. Analyze stock levels, flag items below minimum, suggest reorder quantities, and identify slow-moving or excess stock.`,
  equipment: `You are an equipment management expert. Analyze utilization rates, maintenance schedules, fuel efficiency, and suggest optimal fleet allocation.`,
  safety: `You are a construction safety expert. Analyze incident patterns, identify high-risk areas, suggest preventive measures, and evaluate safety performance metrics.`,
  delays: `You are a delay analysis expert (SCL protocol). Classify delays as excusable/non-excusable, concurrent, analyze EOT claims, and suggest mitigation strategies.`,
  "purchase-orders": `You are a procurement expert. Analyze PO status, supplier performance, cost trends, and suggest procurement optimizations.`,
  manpower: `You are a workforce planning expert. Analyze labor productivity, trade distribution, overtime patterns, and suggest optimal crew sizes.`,
  fuel: `You are a fuel/energy management expert. Analyze consumption patterns, cost per unit, equipment efficiency, and suggest cost reduction measures.`,
  concrete: `You are a concrete technology expert. Analyze pour records, slump trends, temperature effects, supplier quality, and suggest quality improvements.`,
  "daily-quantity": `You are a progress measurement expert. Analyze daily quantities vs planned, productivity rates, and forecast completion dates.`,
  quality: `You are a quality management expert (ISO 19650). Analyze ITP compliance, NCR trends, rework costs, and suggest quality improvements.`,
  welding: `You are a welding engineering expert. Analyze WPS compliance, NDT results, welder qualifications, and defect rates.`,
  dashboard: `You are a project controls expert. Provide executive-level analysis of project health: SPI, CPI, earned value, risk summary, and key recommendations.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, data: reqData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      userPrompt = `Analyze these construction activities:\n${JSON.stringify(reqData.activities, null, 2)}\n\nToday's date: ${new Date().toISOString().split('T')[0]}`;
    } else if (action === "schedule-optimize") {
      systemPrompt = `You are a construction scheduling optimizer. Given the activities, suggest optimizations to reduce project duration, level resources, and improve efficiency. Return practical, actionable suggestions.`;
      userPrompt = `Optimize this schedule:\n${JSON.stringify(reqData.activities, null, 2)}`;
    } else if (action === "module-suggest") {
      const moduleKey = reqData.module || "dashboard";
      systemPrompt = (MODULE_PROMPTS[moduleKey] || MODULE_PROMPTS.dashboard) +
        `\n\nYou are BuildForge AI. Analyze the provided data and give 3-5 smart, actionable suggestions. Be concise and data-driven. Format as markdown with bullet points. Reference specific items by their codes/IDs when possible.`;
      userPrompt = `Here is the current ${moduleKey} data (${reqData.itemCount || 0} items):\n${JSON.stringify(reqData.moduleData?.slice(0, 50), null, 2)}\n\nProvide smart suggestions and insights for this module.`;
    } else if (action === "module-chat") {
      const moduleKey = reqData.module || "dashboard";
      systemPrompt = (MODULE_PROMPTS[moduleKey] || MODULE_PROMPTS.dashboard) +
        `\n\nYou are BuildForge AI, an expert construction project management assistant. You have access to the current module data. Be concise, practical, and data-driven. When analyzing data, reference specific items by their codes/IDs. Format responses with markdown.`;
      const contextSnippet = reqData.moduleData?.slice(0, 30);
      userPrompt = `Current module: ${moduleKey} (${reqData.itemCount || 0} items)\nModule data snapshot:\n${JSON.stringify(contextSnippet, null, 2)}\n\nUser question: ${reqData.message}`;
    } else if (action === "general") {
      systemPrompt = `You are BuildForge AI, an expert construction project management assistant. Help with scheduling, BOQ analysis, cost control, safety, quality management, and all aspects of construction project management. Be concise, practical, and data-driven. When analyzing data, reference specific items by their codes/IDs.`;
      userPrompt = reqData.message;
    } else {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
