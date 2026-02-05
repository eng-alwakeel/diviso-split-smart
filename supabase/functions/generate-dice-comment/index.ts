import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GenerateCommentRequest {
  dice_type: 'activity' | 'food' | 'quick';
  result_label: string;
  result_label_ar?: string;
  group_type?: string;
  member_count?: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface GenerateCommentResponse {
  comment: string;
  comment_en?: string;
}

// Fallback comments based on time of day
const FALLBACK_COMMENTS: Record<string, string[]> = {
  morning: [
    'بداية يوم حلوة 🌅',
    'اختيار صباحي مثالي ☀️',
    'يناسب الجو الصباحي',
  ],
  afternoon: [
    'خيار حلو لنص اليوم 👌',
    'يكسر روتين اليوم',
    'اختيار موفق للوقت الحالي',
  ],
  evening: [
    'مناسب للمسا 🌆',
    'اختيار يناسب وقتكم',
    'خيار جميل للمساء',
  ],
  night: [
    'خيار مريح يناسب الليل 🌙',
    'مناسب لجلسة الليل',
    'اختيار هادي للوقت الحالي',
  ],
};

function getFallbackComment(timeOfDay: string): GenerateCommentResponse {
  const comments = FALLBACK_COMMENTS[timeOfDay] || FALLBACK_COMMENTS['evening'];
  const randomIndex = Math.floor(Math.random() * comments.length);
  return { comment: comments[randomIndex] };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateCommentRequest = await req.json();
    const { dice_type, result_label, result_label_ar, group_type, member_count, time_of_day } = body;

    // Validate input
    if (!time_of_day || !result_label) {
      return new Response(
        JSON.stringify(getFallbackComment('evening')),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    // If no API key, use fallback
    if (!DEEPSEEK_API_KEY) {
      console.log('No DEEPSEEK_API_KEY, using fallback comment');
      return new Response(
        JSON.stringify(getFallbackComment(time_of_day)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for DeepSeek
    const timeLabels: Record<string, string> = {
      morning: 'صباح',
      afternoon: 'ظهر',
      evening: 'مساء',
      night: 'ليل',
    };

    const prompt = `أنت كاتب تعليقات ذكية لتطبيق Diviso. النرد اختار نتيجة عشوائية وأنت تكتب تعليق قصير يشرح لماذا هذه النتيجة مناسبة للسياق الحالي.

السياق:
- نوع النرد: ${dice_type === 'activity' ? 'نشاط' : dice_type === 'food' ? 'أكل' : 'قرار سريع'}
- النتيجة: ${result_label_ar || result_label}
- نوع المجموعة: ${group_type || 'أصدقاء'}
- عدد الأعضاء: ${member_count || 'غير محدد'}
- الوقت: ${timeLabels[time_of_day] || 'مساء'}

القواعد:
1. اكتب جملة واحدة فقط (بدون نقطة في النهاية)
2. استخدم لهجة سعودية ودية
3. اجعل التعليق يبدو طبيعي وليس آلي
4. يمكنك إضافة إيموجي واحد في النهاية
5. لا تذكر "ذكاء اصطناعي" أو "خوارزمية"
6. اجعل التعليق يبرر لماذا الاختيار مناسب للوقت أو العدد

أمثلة على تعليقات جيدة:
- "خيار مريح يناسب وقت الليل وعددكم 👌"
- "يبدو مناسب بعد يوم طويل"
- "قرار بسيط بدون تعقيد ⚡"
- "خفيف وسريع للوقت الحالي"

أرجع JSON فقط بدون أي نص إضافي:
{"comment": "التعليق هنا"}`;

    // Call DeepSeek with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
            { role: 'system', content: 'أنت كاتب تعليقات مختصرة ودية بالعربية. أرجع JSON فقط.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 100,
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

      const commentResponse: GenerateCommentResponse = JSON.parse(jsonContent);

      // Validate the response
      if (!commentResponse.comment || typeof commentResponse.comment !== 'string') {
        throw new Error('Invalid comment format');
      }

      return new Response(
        JSON.stringify(commentResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (aiError) {
      clearTimeout(timeoutId);
      console.error('DeepSeek error, using fallback:', aiError);
      
      return new Response(
        JSON.stringify(getFallbackComment(time_of_day)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in generate-dice-comment:', error);
    
    return new Response(
      JSON.stringify(getFallbackComment('evening')),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
