import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = "https://iwthriddasxzbjddpzzf.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Fallback templates when AI is unavailable
const FALLBACK_TEMPLATES: Record<string, { summary: string; suggestions: Array<{ category: string; title: string; details: string }> }> = {
  trip: {
    summary: "خطة رحلة تحتاج تنسيق للسكن والتنقل والأنشطة. ننصح بتحديد الميزانية وتوزيعها على الفئات الرئيسية.",
    suggestions: [
      { category: "stay", title: "حجز فندق أو شقة", details: "ابحث عن سكن مناسب للمجموعة بالقرب من الأماكن المخطط زيارتها" },
      { category: "transport", title: "ترتيب التنقل", details: "حدد وسيلة النقل: سيارة خاصة، تأجير سيارة، أو مواصلات عامة" },
      { category: "activities", title: "قائمة الأنشطة", details: "اتفقوا على الأنشطة الرئيسية التي تودون القيام بها" },
      { category: "food", title: "خطة الطعام", details: "حددوا ميزانية الأكل: مطاعم، طبخ جماعي، أو مزيج" },
      { category: "transport", title: "حجز التذاكر مبكراً", details: "احجزوا تذاكر الطيران أو القطار مبكراً للحصول على أسعار أفضل" },
      { category: "other", title: "تأمين السفر", details: "فكروا في تأمين سفر يغطي المجموعة" },
    ],
  },
  outing: {
    summary: "طلعة جماعية تحتاج تنسيق بسيط للمكان والتكاليف. الأهم الاتفاق على الوقت والمكان.",
    suggestions: [
      { category: "activities", title: "اختيار المكان", details: "حددوا المكان المناسب للمجموعة وتأكدوا من توفر مواقف" },
      { category: "food", title: "ترتيب الأكل", details: "هل ستطلبون من مطعم أو تجهزون أكل من البيت؟" },
      { category: "transport", title: "التنقل الجماعي", details: "نسقوا الركوب مع بعض لتوفير البنزين والمواقف" },
      { category: "other", title: "جمع التكلفة مقدماً", details: "اجمعوا المبلغ المتوقع من كل شخص قبل الطلعة" },
    ],
  },
  shared_housing: {
    summary: "سكن مشترك يحتاج تنظيم واضح للمصاريف الشهرية وتوزيع المسؤوليات.",
    suggestions: [
      { category: "stay", title: "البحث عن سكن مناسب", details: "ابحثوا عن شقة أو بيت يناسب عدد الأشخاص والميزانية" },
      { category: "other", title: "توزيع المصاريف الثابتة", details: "اتفقوا على تقسيم الإيجار، الكهرباء، الماء، والإنترنت" },
      { category: "food", title: "ترتيب المطبخ", details: "حددوا نظام الأكل: مشترك أو كل شخص لحاله" },
      { category: "other", title: "قواعد السكن", details: "اتفقوا على قواعد أساسية: النظافة، الضيوف، أوقات الهدوء" },
      { category: "other", title: "صندوق الطوارئ", details: "خصصوا مبلغ شهري للصيانة والطوارئ" },
    ],
  },
  activity: {
    summary: "نشاط جماعي يحتاج تنسيق للوقت والمكان والتكلفة. حددوا التفاصيل واتفقوا عليها.",
    suggestions: [
      { category: "activities", title: "تحديد النشاط", details: "اختاروا النشاط واحجزوا المكان إذا لزم الأمر" },
      { category: "other", title: "تحديد التكلفة", details: "اعرفوا التكلفة الإجمالية وقسموها على المشاركين" },
      { category: "transport", title: "التنقل", details: "نسقوا وسيلة الوصول للمكان" },
      { category: "food", title: "وجبة بعد النشاط", details: "رتبوا وجبة جماعية بعد النشاط" },
    ],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
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

    const { plan_id } = await req.json();
    if (!plan_id) {
      return new Response(JSON.stringify({ error: "plan_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user can access the plan
    const { data: canAccess } = await supabase.rpc("can_access_plan", {
      p_user_id: user.id,
      p_plan_id: plan_id,
    });

    if (!canAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: check last AI run for this plan (1 per 10 minutes)
    const { data: existingSummary } = await supabase
      .from("plan_ai_summary")
      .select("updated_at")
      .eq("plan_id", plan_id)
      .single();

    if (existingSummary) {
      const lastRun = new Date(existingSummary.updated_at);
      const now = new Date();
      const diffMs = now.getTime() - lastRun.getTime();
      if (diffMs < 10 * 60 * 1000) {
        const remainingSec = Math.ceil((10 * 60 * 1000 - diffMs) / 1000);
        return new Response(
          JSON.stringify({ error: "rate_limited", retry_after_seconds: remainingSec }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing votes for context
    const { data: votes } = await supabase
      .from("plan_votes")
      .select("title, status")
      .eq("plan_id", plan_id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch members count
    const { count: memberCount } = await supabase
      .from("plan_members")
      .select("*", { count: "exact", head: true })
      .eq("plan_id", plan_id);

    let summary = "";
    let suggestions: Array<{ category: string; title: string; details: string }> = [];

    // Try AI first
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiSuccess = false;

    if (LOVABLE_API_KEY) {
      try {
        const systemPrompt = `أنت مساعد تخطيط ذكي لتطبيق "ديفيزو" لتقسيم المصاريف بين الأصدقاء.
مهمتك: بناءً على تفاصيل الخطة، قدم:
1. ملخص نية (2-3 أسطر) يوضح الفكرة العامة ونصائح سريعة
2. اقتراحات عملية (6-9 اقتراحات كحد أقصى) مصنفة حسب: stay, transport, activities, food, other

يجب أن تكون الاقتراحات عملية وقابلة للتنفيذ ومناسبة للسياق السعودي/الخليجي.
أجب بصيغة JSON فقط بدون أي نص إضافي.`;

        const userPrompt = `تفاصيل الخطة:
- النوع: ${plan.plan_type}
- العنوان: ${plan.title}
- الوجهة: ${plan.destination || "غير محددة"}
- تاريخ البدء: ${plan.start_date || "غير محدد"}
- تاريخ الانتهاء: ${plan.end_date || "غير محدد"}
- الميزانية: ${plan.budget_value ? `${plan.budget_value} ${plan.budget_currency}` : "غير محددة"}
- عدد الأعضاء: ${memberCount || 1}
${votes && votes.length > 0 ? `- تصويتات سابقة: ${votes.map((v) => v.title).join(", ")}` : ""}

أجب بهذا الشكل بالضبط:
{
  "summary": "ملخص النية هنا",
  "suggestions": [
    {"category": "stay", "title": "عنوان الاقتراح", "details": "تفاصيل الاقتراح"}
  ]
}`;

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
            // Extract JSON from response (might have markdown code blocks)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              summary = parsed.summary || "";
              suggestions = (parsed.suggestions || []).slice(0, 9);
              aiSuccess = true;
            }
          }
        } else {
          console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
        }
      } catch (aiError) {
        console.error("AI call failed, using fallback:", aiError);
      }
    }

    // Fallback to templates
    if (!aiSuccess) {
      const template = FALLBACK_TEMPLATES[plan.plan_type] || FALLBACK_TEMPLATES.activity;
      summary = template.summary;
      suggestions = template.suggestions;

      // Customize with destination if available
      if (plan.destination) {
        summary = summary.replace(/خطة/, `خطة إلى ${plan.destination}`);
      }
    }

    // Store results: upsert ai_summary
    await supabase
      .from("plan_ai_summary")
      .upsert(
        { plan_id, intent_summary_text: summary, updated_at: new Date().toISOString() },
        { onConflict: "plan_id" }
      );

    // Delete old suggestions (AI-generated only) and insert new ones
    await supabase
      .from("plan_suggestions")
      .delete()
      .eq("plan_id", plan_id)
      .eq("created_by", "ai");

    if (suggestions.length > 0) {
      await supabase.from("plan_suggestions").insert(
        suggestions.map((s) => ({
          plan_id,
          category: s.category,
          title: s.title,
          details: s.details || null,
          created_by: "ai",
        }))
      );
    }

    return new Response(
      JSON.stringify({ summary, suggestions, ai_powered: aiSuccess }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("plan-ai-suggest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
