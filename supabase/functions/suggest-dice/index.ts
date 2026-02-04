import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SuggestDiceRequest {
  group_type?: string;
  member_count?: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  last_activity?: string;
  available_dice: string[];
}

interface SuggestDiceResponse {
  suggested_dice: string[];
  priority: number;
  allow_dual_roll: boolean;
  reason?: string;
}

function getFallbackSuggestion(
  timeOfDay: string,
  groupType?: string,
  lastActivity?: string
): SuggestDiceResponse {
  // If last activity was restaurant/food, suggest activity
  if (lastActivity && ['restaurant', 'cafe', 'food'].includes(lastActivity)) {
    return {
      suggested_dice: ['activity'],
      priority: 7,
      allow_dual_roll: true,
      reason: 'Last activity was food-related'
    };
  }

  // Lunch or dinner time -> Food dice
  if (timeOfDay === 'afternoon' || timeOfDay === 'evening') {
    return {
      suggested_dice: ['food'],
      priority: 8,
      allow_dual_roll: true,
      reason: 'Meal time - suggesting food'
    };
  }

  // Work groups -> Activity only
  if (groupType === 'work') {
    return {
      suggested_dice: ['activity'],
      priority: 6,
      allow_dual_roll: false,
      reason: 'Work group - activity focus'
    };
  }

  // Default -> Activity dice
  return {
    suggested_dice: ['activity'],
    priority: 5,
    allow_dual_roll: groupType === 'friends' || groupType === 'trip',
    reason: 'Default suggestion'
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SuggestDiceRequest = await req.json();
    const { group_type, member_count, time_of_day, last_activity, available_dice } = body;

    // Validate input
    if (!time_of_day || !available_dice || available_dice.length === 0) {
      return new Response(
        JSON.stringify(getFallbackSuggestion('morning')),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    // If no API key, use fallback
    if (!DEEPSEEK_API_KEY) {
      console.log('No DEEPSEEK_API_KEY, using fallback');
      return new Response(
        JSON.stringify(getFallbackSuggestion(time_of_day, group_type, last_activity)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt for DeepSeek
    const prompt = `أنت مساعد ذكي لتطبيق Diviso. بناءً على السياق التالي، اقترح أي نرد يُعرض للمستخدم.

السياق:
- نوع المجموعة: ${group_type || 'عام'}
- عدد الأعضاء: ${member_count || 'غير محدد'}
- الوقت: ${time_of_day === 'morning' ? 'صباح' : time_of_day === 'afternoon' ? 'ظهر' : time_of_day === 'evening' ? 'مساء' : 'ليل'}
- آخر نشاط: ${last_activity || 'لا يوجد'}
- النرد المتاح: ${available_dice.join(', ')}

القواعد:
1. في وقت الغداء أو العشاء (afternoon/evening) → أولوية لنرد الأكل (food)
2. مجموعات الأصدقاء (friends) → كلا النردين متاحين
3. مجموعات العمل (work) → نرد النشاط فقط
4. إذا آخر نشاط كان مطعم أو كافيه → اقترح نرد النشاط
5. في الصباح → نرد النشاط
6. الرحلات (trip) → كلا النردين متاحين

أرجع JSON فقط بدون أي نص إضافي:
{"suggested_dice": ["activity"], "priority": 8, "allow_dual_roll": true, "reason": "سبب قصير"}`;

    // Call DeepSeek with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'أنت مساعد يرجع JSON فقط بدون أي تنسيق أو markdown.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in DeepSeek response');
      }

      // Parse JSON from response (handle potential markdown wrapping)
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const suggestion: SuggestDiceResponse = JSON.parse(jsonContent);

      // Validate the suggestion
      if (!suggestion.suggested_dice || !Array.isArray(suggestion.suggested_dice)) {
        throw new Error('Invalid suggestion format');
      }

      // Filter to only available dice
      suggestion.suggested_dice = suggestion.suggested_dice.filter(d => 
        available_dice.includes(d)
      );

      if (suggestion.suggested_dice.length === 0) {
        suggestion.suggested_dice = [available_dice[0]];
      }

      return new Response(
        JSON.stringify(suggestion),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      clearTimeout(timeoutId);
      console.error('DeepSeek error, using fallback:', aiError);
      
      return new Response(
        JSON.stringify(getFallbackSuggestion(time_of_day, group_type, last_activity)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in suggest-dice:', error);
    
    return new Response(
      JSON.stringify(getFallbackSuggestion('morning')),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
