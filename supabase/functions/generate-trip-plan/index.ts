import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripPlanRequest {
  destination: string;
  destination_ar?: string;
  days: number;
  budget: 'low' | 'medium' | 'high' | 'luxury';
  interests: string[];
  group_id?: string;
  country_code?: string;
}

interface DayPlan {
  day: number;
  title: string;
  titleAr: string;
  items: PlanItem[];
}

interface PlanItem {
  id: string;
  type: 'accommodation' | 'activity' | 'restaurant' | 'transport';
  time: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  estimatedPrice?: number;
  currency: string;
  affiliateUrl?: string;
  partnerId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const body: TripPlanRequest = await req.json();
    const { destination, destination_ar, days, budget, interests, group_id, country_code } = body;

    if (!destination || !days || days < 1 || days > 30) {
      return new Response(
        JSON.stringify({ error: 'Invalid destination or days' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let planData: DayPlan[] = [];

    // Try AI-powered plan generation
    if (lovableApiKey) {
      try {
        const prompt = buildTripPlanPrompt(destination, days, budget, interests);
        
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `أنت خبير تخطيط رحلات. أنشئ خطة سفر مفصلة يوماً بيوم.

يجب أن تكون الإجابة بصيغة JSON فقط:
{
  "days": [
    {
      "day": 1,
      "title": "Day title in English",
      "titleAr": "عنوان اليوم بالعربية",
      "items": [
        {
          "type": "accommodation|activity|restaurant|transport",
          "time": "09:00",
          "name": "Place name",
          "nameAr": "اسم المكان",
          "description": "Brief description",
          "descriptionAr": "وصف مختصر",
          "estimatedPrice": 100
        }
      ]
    }
  ]
}

كل يوم يجب أن يتضمن: إقامة (في اليوم الأول فقط أو عند التغيير)، 2-3 أنشطة، ومطعم واحد على الأقل.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 3000
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.days && Array.isArray(parsed.days)) {
                  planData = parsed.days.map((day: any) => ({
                    day: day.day,
                    title: day.title || `Day ${day.day}`,
                    titleAr: day.titleAr || `اليوم ${day.day}`,
                    items: (day.items || []).map((item: any, idx: number) => ({
                      id: `item_${day.day}_${idx}`,
                      type: item.type || 'activity',
                      time: item.time || '10:00',
                      name: item.name || 'Activity',
                      nameAr: item.nameAr || item.name,
                      description: item.description || '',
                      descriptionAr: item.descriptionAr || item.description,
                      estimatedPrice: item.estimatedPrice,
                      currency: 'SAR'
                    }))
                  }));
                }
              }
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
            }
          }
        }
      } catch (aiError) {
        console.error('AI request failed:', aiError);
      }
    }

    // Fallback to template-based plan
    if (planData.length === 0) {
      planData = generateFallbackPlan(destination, days, budget, interests);
    }

    // Save the plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from('trip_plans')
      .insert({
        user_id: user.id,
        group_id,
        destination,
        destination_ar: destination_ar || destination,
        country_code,
        days,
        budget,
        interests,
        plan_data: { days: planData },
        is_public: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving plan:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save plan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: savedPlan,
        shareUrl: `/trip/${savedPlan.share_token}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-trip-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildTripPlanPrompt(
  destination: string,
  days: number,
  budget: string,
  interests: string[]
): string {
  const budgetLabels: Record<string, string> = {
    low: 'اقتصادي (أقل من 500 ريال/يوم)',
    medium: 'متوسط (500-1000 ريال/يوم)',
    high: 'فاخر (1000-2000 ريال/يوم)',
    luxury: 'فخم جداً (أكثر من 2000 ريال/يوم)'
  };

  const interestsList = interests.length > 0 
    ? interests.join('، ') 
    : 'سياحة عامة، طعام، تسوق';

  return `خطط رحلة إلى ${destination} لمدة ${days} أيام.
الميزانية: ${budgetLabels[budget] || 'متوسط'}
الاهتمامات: ${interestsList}

أنشئ خطة مفصلة تتضمن:
- فندق مناسب
- 2-3 أنشطة يومية
- مطاعم للغداء والعشاء
- وسائل النقل عند الحاجة

يجب أن تكون الأماكن حقيقية ومعروفة في ${destination}.`;
}

function generateFallbackPlan(
  destination: string,
  days: number,
  budget: string,
  interests: string[]
): DayPlan[] {
  const plan: DayPlan[] = [];
  
  for (let day = 1; day <= days; day++) {
    const dayPlan: DayPlan = {
      day,
      title: `Day ${day}: Exploring ${destination}`,
      titleAr: `اليوم ${day}: استكشاف ${destination}`,
      items: []
    };

    // Add accommodation on day 1
    if (day === 1) {
      dayPlan.items.push({
        id: `item_${day}_hotel`,
        type: 'accommodation',
        time: '14:00',
        name: `Hotel in ${destination}`,
        nameAr: `فندق في ${destination}`,
        description: 'Check-in and settle in',
        descriptionAr: 'تسجيل الوصول والاستقرار',
        estimatedPrice: budget === 'luxury' ? 1500 : budget === 'high' ? 800 : budget === 'medium' ? 400 : 200,
        currency: 'SAR'
      });
    }

    // Morning activity
    dayPlan.items.push({
      id: `item_${day}_morning`,
      type: 'activity',
      time: '09:00',
      name: `Morning Tour in ${destination}`,
      nameAr: `جولة صباحية في ${destination}`,
      description: 'Explore local attractions',
      descriptionAr: 'استكشاف المعالم المحلية',
      estimatedPrice: 100,
      currency: 'SAR'
    });

    // Lunch
    dayPlan.items.push({
      id: `item_${day}_lunch`,
      type: 'restaurant',
      time: '13:00',
      name: `Local Restaurant in ${destination}`,
      nameAr: `مطعم محلي في ${destination}`,
      description: 'Enjoy local cuisine',
      descriptionAr: 'استمتع بالمأكولات المحلية',
      estimatedPrice: budget === 'luxury' ? 300 : budget === 'high' ? 150 : 80,
      currency: 'SAR'
    });

    // Afternoon activity
    dayPlan.items.push({
      id: `item_${day}_afternoon`,
      type: 'activity',
      time: '16:00',
      name: `Afternoon Activity in ${destination}`,
      nameAr: `نشاط بعد الظهر في ${destination}`,
      description: 'Continue exploring or relaxing',
      descriptionAr: 'استمر في الاستكشاف أو الاسترخاء',
      estimatedPrice: 150,
      currency: 'SAR'
    });

    // Dinner
    dayPlan.items.push({
      id: `item_${day}_dinner`,
      type: 'restaurant',
      time: '20:00',
      name: `Dinner Restaurant in ${destination}`,
      nameAr: `مطعم عشاء في ${destination}`,
      description: 'Evening dining experience',
      descriptionAr: 'تجربة عشاء مميزة',
      estimatedPrice: budget === 'luxury' ? 400 : budget === 'high' ? 200 : 100,
      currency: 'SAR'
    });

    plan.push(dayPlan);
  }

  return plan;
}
