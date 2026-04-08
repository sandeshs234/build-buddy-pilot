import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEPAL_STANDARDS_PROMPT = `You are an expert Quantity Surveyor and Construction Engineer specializing in Nepal construction standards.

You must use the following Nepal-specific standards and specifications:
- Nepal National Building Code (NBC): NBC 105, NBC 205, NBC 206
- Nepal District Rate Analysis (current Nagar/Jilla Dar Rates)
- Department of Roads (DoR) Standard Specifications
- Nepal Electricity Authority (NEA) Standards for electrical works
- Nepal Bureau of Standards and Metrology (NBSM) specifications
- IS codes commonly adopted in Nepal (IS 456, IS 1786, IS 383, IS 269, IS 8112, IS 2062)

## Material Analysis Rules:

### RCC Works (Per Nepal NBC & IS 456):
- Cement: OPC 53 Grade (IS 8112) or PPC (IS 1489)
- Steel: Fe500/Fe500D TMT bars (IS 1786) - Nepal brands: Himal, Panchakanya, Jagdamba
- Aggregates: 20mm & 10mm (IS 383) - local sources
- Sand: Zone II river sand or manufactured sand
- Water: Potable quality (IS 456 Cl 5.4)
- Mix ratios per grade: M15(1:2:4), M20(1:1.5:3), M25(1:1:2), M30(design mix)
- Wastage factors: Cement 3%, Steel 5%, Aggregate 10%, Sand 10%
- Steel consumption: Footings 80-100 kg/m³, Columns 150-200, Beams 120-150, Slabs 80-100, Retaining walls 100-130

### Masonry & Plastering (Per Nepal District Rates):
- Brick: Standard Nepal brick 230x115x75mm
- Cement mortar ratios: 1:4 (structural), 1:6 (non-structural)
- Plaster thickness: 12mm internal, 15-20mm external
- Per m³ brickwork: ~500 bricks, 0.3m³ mortar
- Pointing: 1:3 cement-sand mortar

### Road & Earthworks (Per DoR Specs):
- Sub-base: GSB (Granular Sub-Base) per DoR Table 500-1
- WBM: Water Bound Macadam per DoR specs
- Bituminous: Tack coat 0.25 kg/m², Prime coat 0.9 kg/m²
- DBM/BC: As per DoR section 500
- Compaction: 95% MDD (Modified Proctor)
- Earth cutting/filling factors: Bulking 25%, Shrinkage 15%

### Plumbing (Per Nepal Standards):
- HDPE/PPR pipes for water supply
- PVC/uPVC for drainage
- GI pipes for external water lines
- Fittings as per IS/Nepal standards

### Electrical (Per NEA/NEC):
- Copper wiring per NEC standards
- PVC conduits IS 9537
- MCB/RCCB as per IS/IEC standards
- Earthing: GI plate/pipe earthing per IS 3043

### All Construction Types:
- Formwork: Steel/plywood, 8-12 uses, area = perimeter × height for columns, plan area for slabs
- Curing: 7 days minimum (IS 456), water @3 liters/m²/day
- Waterproofing: APP membrane, liquid applied, or crystalline
- Insulation: EPS/XPS for thermal, rockwool for fire rating
- Painting: 1 coat primer + 2 coats finish, coverage per manufacturer
- Tiling: Adhesive method or CM 1:4, grouting 2-3mm joints
- False ceiling: GI framework + gypsum board 12.5mm
- Aluminium works: Section 6063-T6, powder coated
- Structural steel: IS 2062 Grade E250/E350

When computing materials:
1. Always apply wastage factors
2. Round up quantities to practical procurement units
3. Include all ancillary materials (binding wire, nails, spacers, etc.)
4. Group materials by procurement category
5. Flag items that need special procurement lead time in Nepal
6. Suggest local Nepal suppliers/brands where applicable`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const reqBody = await req.json();
    const { action, boqItems, existingActivities, existingInventory, projectDescription } = reqBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = NEPAL_STANDARDS_PROMPT;
    let userPrompt = "";
    let tools: any[] | undefined;
    let toolChoice: any = undefined;

    if (action === "analyze-materials") {
      systemPrompt += `\n\nAnalyze the BOQ items and calculate ALL required materials with quantities. Return structured data using the provided tool.`;
      userPrompt = `Analyze these BOQ items and calculate required materials per Nepal standards:\n${JSON.stringify(boqItems, null, 2)}\n\nExisting inventory:\n${JSON.stringify(existingInventory?.slice(0, 50) || [], null, 2)}`;
      
      tools = [{
        type: "function",
        function: {
          name: "material_analysis",
          description: "Return material requirements computed from BOQ items",
          parameters: {
            type: "object",
            properties: {
              materials: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string", description: "Material code e.g. MAT-001" },
                    description: { type: "string" },
                    unit: { type: "string" },
                    requiredQty: { type: "number" },
                    wastePercent: { type: "number" },
                    totalWithWaste: { type: "number" },
                    category: { type: "string", enum: ["Cement", "Steel", "Aggregate", "Sand", "Brick", "Timber", "Plumbing", "Electrical", "Bituminous", "Hardware", "Paint", "Waterproofing", "Tiles", "Other"] },
                    nepalStandard: { type: "string", description: "Applicable Nepal/IS standard" },
                    estimatedRate: { type: "number", description: "Estimated rate in NPR" },
                    remarks: { type: "string" },
                    linkedBoqCodes: { type: "array", items: { type: "string" } }
                  },
                  required: ["code", "description", "unit", "requiredQty", "totalWithWaste", "category"]
                }
              },
              summary: {
                type: "object",
                properties: {
                  totalMaterials: { type: "number" },
                  categories: { type: "array", items: { type: "object", properties: { name: { type: "string" }, count: { type: "number" }, estimatedCost: { type: "number" } } } },
                  criticalItems: { type: "array", items: { type: "string" }, description: "Items needing special procurement attention" },
                  recommendations: { type: "array", items: { type: "string" } }
                }
              }
            },
            required: ["materials", "summary"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "material_analysis" } };

    } else if (action === "generate-activities") {
      systemPrompt += `\n\nGenerate a construction activity schedule from BOQ items. Create logical WBS structure with realistic durations for Nepal construction context. Return structured data.`;
      userPrompt = `Generate activities/schedule from these BOQ items:\n${JSON.stringify(boqItems, null, 2)}\n\nExisting activities (avoid duplicates):\n${JSON.stringify(existingActivities?.slice(0, 30) || [], null, 2)}`;

      tools = [{
        type: "function",
        function: {
          name: "generate_activities",
          description: "Return activities generated from BOQ items",
          parameters: {
            type: "object",
            properties: {
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    wbs: { type: "string", description: "WBS code e.g. 1.1.1" },
                    name: { type: "string" },
                    durationDays: { type: "number" },
                    predecessors: { type: "string", description: "Comma-separated WBS codes" },
                    linkedBoqCodes: { type: "array", items: { type: "string" } },
                    category: { type: "string" }
                  },
                  required: ["wbs", "name", "durationDays"]
                }
              },
              cpmSummary: {
                type: "object",
                properties: {
                  totalDuration: { type: "number" },
                  criticalPath: { type: "array", items: { type: "string" } },
                  phases: { type: "array", items: { type: "object", properties: { name: { type: "string" }, duration: { type: "number" }, activities: { type: "number" } } } }
                }
              }
            },
            required: ["activities"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_activities" } };

    } else if (action === "sync-analysis") {
      // Full sync: materials + activities + inventory gaps
      systemPrompt += `\n\nPerform a comprehensive cross-module analysis: materials needed, activities to create, and inventory gaps. Use the tool to return structured data.`;
      userPrompt = `Full cross-module analysis for these BOQ items:\n${JSON.stringify(boqItems, null, 2)}\n\nExisting activities:\n${JSON.stringify(existingActivities?.slice(0, 30) || [], null, 2)}\n\nExisting inventory:\n${JSON.stringify(existingInventory?.slice(0, 50) || [], null, 2)}`;

      tools = [{
        type: "function",
        function: {
          name: "cross_module_sync",
          description: "Return comprehensive cross-module analysis",
          parameters: {
            type: "object",
            properties: {
              materials: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    description: { type: "string" },
                    unit: { type: "string" },
                    requiredQty: { type: "number" },
                    totalWithWaste: { type: "number" },
                    category: { type: "string" },
                    nepalStandard: { type: "string" },
                    linkedBoqCodes: { type: "array", items: { type: "string" } }
                  },
                  required: ["code", "description", "unit", "requiredQty", "totalWithWaste", "category"]
                }
              },
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    wbs: { type: "string" },
                    name: { type: "string" },
                    durationDays: { type: "number" },
                    predecessors: { type: "string" },
                    linkedBoqCodes: { type: "array", items: { type: "string" } }
                  },
                  required: ["wbs", "name", "durationDays"]
                }
              },
              inventoryGaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    materialCode: { type: "string" },
                    description: { type: "string" },
                    required: { type: "number" },
                    available: { type: "number" },
                    shortage: { type: "number" },
                    unit: { type: "string" }
                  },
                  required: ["materialCode", "description", "required", "available", "shortage"]
                }
              },
              summary: { type: "string" }
            },
            required: ["materials", "activities", "inventoryGaps", "summary"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "cross_module_sync" } };
    } else if (action === "generate-boq") {
      systemPrompt += `\n\nYou are generating a complete BOQ (Bill of Quantities) from a project description. Create realistic items with proper codes, descriptions, units, quantities, and rates based on Nepal construction standards and current market rates. Include all major work categories: earthwork, concrete, masonry, finishing, MEP, etc.`;
      userPrompt = `Generate a complete BOQ for the following project:\n\n${projectDescription || "Construction project"}\n\nProvide realistic quantities and current Nepal market rates in NPR.`;

      tools = [{
        type: "function",
        function: {
          name: "generate_boq",
          description: "Return a complete BOQ with items, quantities, and rates",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string", description: "Item code e.g. EW-001, RC-001" },
                    description: { type: "string", description: "Detailed work description" },
                    unit: { type: "string", description: "Unit of measurement" },
                    measureType: { type: "string", enum: ["direct", "rectangular", "trapezoidal", "rebar"] },
                    totalQty: { type: "number", description: "Estimated quantity" },
                    rate: { type: "number", description: "Unit rate in NPR" },
                    category: { type: "string", description: "Work category" }
                  },
                  required: ["code", "description", "unit", "totalQty", "rate"]
                }
              },
              summary: {
                type: "object",
                properties: {
                  totalItems: { type: "number" },
                  estimatedBudget: { type: "number" },
                  categories: { type: "array", items: { type: "object", properties: { name: { type: "string" }, itemCount: { type: "number" }, subtotal: { type: "number" } } } }
                }
              }
            },
            required: ["items", "summary"]
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "generate_boq" } };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
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
    
    // Extract tool call result
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content
    const content = result.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("boq-material-analysis error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
