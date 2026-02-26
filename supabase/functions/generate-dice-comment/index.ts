import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GenerateCommentRequest {
  dice_type: 'activity' | 'food' | 'cuisine' | 'budget' | 'whopays' | 'task' | 'quick';
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

// Fallback comments based on time of day and dice type
const FALLBACK_COMMENTS: Record<string, Record<string, string[]>> = {
  default: {
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
  },
  budget: {
    morning: ['ميزانية مناسبة للصباح 💰'],
    afternoon: ['ميزانية معقولة لنص اليوم 👌'],
    evening: ['ميزانية حلوة للمسا 💵'],
    night: ['ميزانية مريحة لجلسة الليل 🌙'],
  },
  whopays: {
    morning: ['يا حظه الصباح 😅'],
    afternoon: ['القرعة وقعت عليه 👀'],
    evening: ['يدفع اليوم وبكرا نشوف 😂'],
    night: ['الحظ اختاره الليلة 🎯'],
  },
  task: {
    morning: ['مهمة بسيطة تبدأ فيها يومك ✅'],
    afternoon: ['خلّها ما تنسى اليوم 📋'],
    evening: ['مهمة سريعة قبل ما ينتهي اليوم ⚡'],
    night: ['ممكن تأجلها للصباح 😴'],
  },
};

function getFallbackComment(timeOfDay: string, diceType?: string): GenerateCommentResponse {
  const typeComments = FALLBACK_COMMENTS[diceType || 'default'] || FALLBACK_COMMENTS['default'];
  const comments = typeComments[timeOfDay] || typeComments['evening'] || FALLBACK_COMMENTS['default']['evening'];
  const randomIndex = Math.floor(Math.random() * comments.length);
  return { comment: comments[randomIndex] };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateCommentRequest = await req.json();
    const { dice_type, result_label, result_label_ar, group_type, member_count, time_of_day } = body;

    if (!time_of_day || !result_label) {
      return new Response(
        JSON.stringify(getFallbackComment('evening', dice_type)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    
    if (!DEEPSEEK_API_KEY) {
      console.log('No DEEPSEEK_API_KEY, using fallback comment');
      return new Response(
        JSON.stringify(getFallbackComment(time_of_day, dice_type)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timeLabels: Record<string, string> = {
      morning: 'صباح',
      afternoon: 'ظهر',
      evening: 'مساء',
      night: 'ليل',
    };

    const diceTypeLabels: Record<string, string> = {
      activity: 'نشاط',
      food: 'أكل',
      cuisine: 'مطبخ',
      budget: 'ميزانية',
      whopays: 'مين يدفع',
      task: 'مهمة يومية',
      quick: 'قرار سريع',
    };

    const prompt = `أنت كاتب تعليقات ذكية لتطبيق Diviso. النرد اختار نتيجة عشوائية وأنت تكتب تعليق قصير يشرح لماذا هذه النتيجة مناسبة للسياق الحالي.

السياق:
- نوع النرد: ${diceTypeLabels[dice_type] || 'نشاط'}
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

أرجع JSON فقط بدون أي نص إضافي:
{"comment": "التعليق هنا"}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

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

      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const commentResponse: GenerateCommentResponse = JSON.parse(jsonContent);

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
        JSON.stringify(getFallbackComment(time_of_day, dice_type)),
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
