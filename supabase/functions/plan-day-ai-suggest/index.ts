import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = "https://iwthriddasxzbjddpzzf.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Activity {
  title: string;
  description: string;
  time_slot: "morning" | "afternoon" | "evening" | "any";
  estimated_cost: number | null;
}

// Fallback templates by plan_type and day position
function getFallbackActivities(
  planType: string,
  dayIndex: number,
  totalDays: number
): Activity[] {
  const isFirst = dayIndex === 1;
  const isLast = dayIndex === totalDays;

  if (planType === "trip") {
    if (isFirst) {
      return [
        { title: "الوصول والتسجيل", description: "الوصول إلى الوجهة وتسجيل الدخول في الفندق أو السكن", time_slot: "morning", estimated_cost: null },
        { title: "استكشاف المنطقة المحيطة", description: "جولة أولية في المنطقة القريبة والتعرف على الأماكن", time_slot: "afternoon", estimated_cost: null },
        { title: "عشاء جماعي ترحيبي", description: "وجبة عشاء جماعية للتعارف وبداية الرحلة", time_slot: "evening", estimated_cost: 200 },
      ];
    }
    if (isLast) {
      return [
        { title: "إفطار وتسوق هدايا", description: "إفطار مبكر ثم جولة تسوق لشراء الهدايا التذكارية", time_slot: "morning", estimated_cost: 150 },
        { title: "تسليم السكن والمغادرة", description: "تسليم الغرف وترتيب الأمتعة للمغادرة", time_slot: "afternoon", estimated_cost: null },
      ];
    }
    return [
      { title: "نشاط صباحي رئيسي", description: "النشاط الرئيسي لليوم - زيارة معلم أو نشاط مغامرة", time_slot: "morning", estimated_cost: 300 },
      { title: "غداء وراحة", description: "وجبة غداء جماعية ثم وقت حر للراحة", time_slot: "afternoon", estimated_cost: 150 },
      { title: "سهرة جماعية", description: "نشاط مسائي ممتع مع المجموعة", time_slot: "evening", estimated_cost: 100 },
    ];
  }

  // Default for outing/activity/shared_housing
  if (isFirst && totalDays === 1) {
    return [
      { title: "التجمع والانطلاق", description: "التجمع في نقطة الالتقاء والانطلاق للنشاط", time_slot: "morning", estimated_cost: null },
      { title: "النشاط الرئيسي", description: "تنفيذ النشاط المخطط له", time_slot: "afternoon", estimated_cost: 200 },
      { title: "وجبة ختامية", description: "وجبة جماعية لاختتام اليوم", time_slot: "evening", estimated_cost: 150 },
    ];
  }

  return [
    { title: "نشاط صباحي", description: "نشاط خفيف في الصباح", time_slot: "morning", estimated_cost: null },
    { title: "نشاط رئيسي", description: "النشاط الأساسي لليوم", time_slot: "afternoon", estimated_cost: 200 },
    { title: "نشاط مسائي", description: "نشاط مسائي مع المجموعة", time_slot: "evening", estimated_cost: 100 },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { day_id, preferences } = await req.json();
    if (!day_id) {
      return new Response(JSON.stringify({ error: "day_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch day with plan info
    const { data: day, error: dayError } = await supabase
      .from("plan_days")
      .select("id, plan_id, date, day_index")
      .eq("id", day_id)
      .single();

    if (dayError || !day) {
      return new Response(JSON.stringify({ error: "Day not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check access
    const { data: canAccess } = await supabase.rpc("can_access_plan", {
      p_user_id: user.id,
      p_plan_id: day.plan_id,
    });

    if (!canAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: check last AI activity for this day (10 min)
    const { data: lastAiActivity } = await supabase
      .from("plan_day_activities")
      .select("created_at")
      .eq("plan_day_id", day_id)
      .eq("created_by", "ai")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastAiActivity) {
      const lastRun = new Date(lastAiActivity.created_at);
      const diffMs = Date.now() - lastRun.getTime();
      if (diffMs < 10 * 60 * 1000) {
        const retryAfter = Math.ceil((10 * 60 * 1000 - diffMs) / 1000);
        return new Response(
          JSON.stringify({ error: "rate_limited", retry_after_seconds: retryAfter }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch plan
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", day.plan_id)
      .single();

    if (!plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check destination
    if (!plan.destination) {
      return new Response(
        JSON.stringify({ error: "no_destination", message: "أضف وجهة الخطة أولاً للحصول على اقتراحات مخصصة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count total days
    const { count: totalDays } = await supabase
      .from("plan_days")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", day.plan_id);

    const total = totalDays || 1;

    // Fetch all days for this plan to get existing activities
    const { data: allPlanDays } = await supabase
      .from("plan_days")
      .select("id, day_index")
      .eq("plan_id", day.plan_id)
      .order("day_index", { ascending: true });

    // Fetch existing activities from all days
    const otherDayIds = (allPlanDays || [])
      .filter((d) => d.id !== day_id)
      .map((d) => d.id);

    let existingActivitiesText = "";
    if (otherDayIds.length > 0) {
      const { data: otherActivities } = await supabase
        .from("plan_day_activities")
        .select("title, plan_day_id")
        .in("plan_day_id", otherDayIds);

      if (otherActivities && otherActivities.length > 0) {
        // Group activities by day
        const dayIndexMap = new Map((allPlanDays || []).map((d) => [d.id, d.day_index]));
        const activitiesByDay = new Map<number, string[]>();

        for (const act of otherActivities) {
          const idx = dayIndexMap.get(act.plan_day_id) || 0;
          if (!activitiesByDay.has(idx)) activitiesByDay.set(idx, []);
          activitiesByDay.get(idx)!.push(act.title);
        }

        const lines: string[] = [];
        for (const [idx, titles] of Array.from(activitiesByDay.entries()).sort((a, b) => a[0] - b[0])) {
          lines.push(`- اليوم ${idx}: ${titles.join("، ")}`);
        }
        existingActivitiesText = lines.join("\n");
      }
    }

    let activities: Activity[] = [];
    let aiPowered = false;

    // Try AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      try {
        const isFirst = day.day_index === 1;
        const isLast = day.day_index === total;
        const dayPosition = isFirst ? "اليوم الأول (وصول)" : isLast ? "اليوم الأخير (مغادرة)" : `يوم ${day.day_index} من ${total} (يوم وسط)`;

        const systemPrompt = `أنت مخطط رحلات ذكي. مهمتك اقتراح أنشطة ليوم محدد من خطة.
قدم 3-5 أنشطة مناسبة لموقع اليوم في الرحلة.
مهم جداً: لا تكرر أي نشاط أو مكان تم اقتراحه في أيام أخرى.
كل يوم يجب أن يحتوي على أماكن وتجارب مختلفة تماماً.
كل نشاط يجب أن يحتوي: title, description, time_slot (morning/afternoon/evening), estimated_cost (رقم أو null).
أجب بصيغة JSON فقط.`;

        const userPrompt = `تفاصيل الخطة:
- النوع: ${plan.plan_type}
- الوجهة: ${plan.destination}
- الميزانية: ${plan.budget_value ? `${plan.budget_value} ${plan.budget_currency}` : "غير محددة"}
- التاريخ: ${day.date}
- ${dayPosition}
${preferences ? `- تفضيلات المستخدم: ${preferences}` : ""}
${existingActivitiesText ? `\nالأنشطة المقترحة مسبقاً في أيام أخرى (يجب تجنب تكرارها بالكامل):\n${existingActivitiesText}\n\nاقترح أنشطة جديدة ومختلفة تماماً لهذا اليوم.` : ""}

أجب بهذا الشكل:
{"activities": [{"title": "...", "description": "...", "time_slot": "morning|afternoon|evening", "estimated_cost": null}]}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              activities = (parsed.activities || []).slice(0, 7).map((a: any) => ({
                title: a.title || "نشاط",
                description: a.description || "",
                time_slot: ["morning", "afternoon", "evening", "any"].includes(a.time_slot) ? a.time_slot : "any",
                estimated_cost: typeof a.estimated_cost === "number" ? a.estimated_cost : null,
              }));
              aiPowered = true;
            }
          }
        } else {
          const errStatus = aiResponse.status;
          if (errStatus === 429) {
            return new Response(
              JSON.stringify({ error: "AI rate limited, please try again later." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (errStatus === 402) {
            return new Response(
              JSON.stringify({ error: "Payment required for AI features." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error("AI gateway error:", errStatus);
        }
      } catch (aiErr) {
        console.error("AI call failed, using fallback:", aiErr);
      }
    }

    // Fallback
    if (!aiPowered || activities.length === 0) {
      activities = getFallbackActivities(plan.plan_type, day.day_index, total);
    }

    // Delete previous AI activities for this day
    await supabase
      .from("plan_day_activities")
      .delete()
      .eq("plan_day_id", day_id)
      .eq("created_by", "ai");

    // Insert new activities
    if (activities.length > 0) {
      const { error: insertError } = await supabase.from("plan_day_activities").insert(
        activities.map((a) => ({
          plan_day_id: day_id,
          title: a.title,
          description: a.description,
          time_slot: a.time_slot,
          estimated_cost: a.estimated_cost,
          currency: plan.budget_currency || "SAR",
          status: "proposed",
          created_by: "ai",
        }))
      );

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ activities, ai_powered: aiPowered }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("plan-day-ai-suggest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
