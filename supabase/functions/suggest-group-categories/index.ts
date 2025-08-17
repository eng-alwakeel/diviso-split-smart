import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { groupType, groupName, expectedBudget, memberCount } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get existing categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name_ar');

    if (categoriesError) {
      throw new Error('Failed to fetch categories');
    }

    // Create context for AI
    const availableCategories = categories.map(cat => `${cat.name_ar} (${cat.id})`).join(', ');
    
    // Define category templates for different group types
    const categoryTemplates = {
      'رحلة': ['مواصلات', 'طيران', 'فنادق', 'مطاعم', 'تذاكر دخول', 'تسوق تذكارات', 'تأمين السفر'],
      'سكن مشترك': ['إيجار', 'كهرباء', 'ماء', 'إنترنت', 'تنظيف', 'صيانة', 'أثاث'],
      'مشروع عمل': ['مكتب', 'معدات', 'تسويق', 'رواتب', 'مواد أولية', 'مصاريف قانونية'],
      'عشاء جماعي': ['مطاعم', 'مشروبات', 'حلويات', 'خدمة', 'نقل'],
      'هدية جماعية': ['الهدية الرئيسية', 'غلاف', 'كرت', 'شحن', 'مصاريف إضافية'],
      'حفلة': ['قاعة', 'طعام', 'زينة', 'تصوير', 'موسيقى', 'هدايا'],
      'رياضة': ['عضوية نادي', 'معدات', 'ملابس', 'مكملات', 'نقل'],
      'عام': ['مصاريف متنوعة', 'طوارئ', 'أساسيات']
    };

    const suggestedTemplate = categoryTemplates[groupType] || categoryTemplates['عام'];

    const prompt = `
أنت مساعد ذكي متخصص في إدارة الميزانيات والمصاريف الجماعية. مهمتك اقتراح فئات مناسبة لمجموعة جديدة.

معلومات المجموعة:
- نوع المجموعة: ${groupType}
- اسم المجموعة: ${groupName}
- الميزانية المتوقعة: ${expectedBudget || 'غير محددة'}
- عدد الأعضاء: ${memberCount || 'غير محدد'}

الفئات المتاحة في النظام: ${availableCategories}

القوالب المقترحة لهذا النوع: ${suggestedTemplate.join(', ')}

اقترح 4-8 فئات مناسبة لهذه المجموعة مع مبالغ مقترحة ونسب من الميزانية الإجمالية. 
أعطِ أولوية للفئات الموجودة في النظام، وإذا لم تجد فئة مناسبة، اقترح إنشاء فئة جديدة.

أجب بتنسيق JSON فقط:
{
  "suggestions": [
    {
      "category_id": "معرف الفئة الموجودة أو null للفئة الجديدة",
      "category_name": "اسم الفئة",
      "suggested_amount": المبلغ المقترح,
      "percentage": النسبة المئوية من الميزانية,
      "reason": "سبب اقتراح هذه الفئة",
      "confidence": قيمة من 0 إلى 1 تعبر عن ثقة الاقتراح,
      "is_new_category": true أو false
    }
  ],
  "total_suggested_budget": إجمالي الميزانية المقترحة,
  "analysis": "تحليل موجز لنوع المجموعة واحتياجاتها"
}
`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في إدارة الميزانيات والتخطيط المالي. أجب باللغة العربية وبتنسيق JSON صحيح فقط.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    let aiResponse = openAIData.choices[0].message.content;

    // Parse AI response
    let suggestions;
    try {
      // Clean the response to ensure it's valid JSON
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response:', aiResponse);
      
      // Fallback to default suggestions
      suggestions = {
        suggestions: suggestedTemplate.slice(0, 5).map((name, index) => ({
          category_id: null,
          category_name: name,
          suggested_amount: expectedBudget ? Math.floor((expectedBudget * 0.2) * (1 + index * 0.1)) : 1000,
          percentage: 20,
          reason: `فئة أساسية لمجموعة ${groupType}`,
          confidence: 0.8,
          is_new_category: true
        })),
        total_suggested_budget: expectedBudget || 5000,
        analysis: `اقتراحات افتراضية لمجموعة ${groupType}`
      };
    }

    // Match existing categories and mark new ones
    suggestions.suggestions = suggestions.suggestions.map(suggestion => {
      const existingCategory = categories.find(cat => 
        cat.name_ar.toLowerCase().includes(suggestion.category_name.toLowerCase()) ||
        suggestion.category_name.toLowerCase().includes(cat.name_ar.toLowerCase())
      );
      
      if (existingCategory) {
        return {
          ...suggestion,
          category_id: existingCategory.id,
          category_name: existingCategory.name_ar,
          is_new_category: false
        };
      }
      
      return {
        ...suggestion,
        is_new_category: true
      };
    });

    // Store suggestions for learning purposes
    try {
      await supabase
        .from('ai_suggestions')
        .insert({
          user_id: user.id,
          suggestion_type: 'group_categories',
          content: {
            group_type: groupType,
            group_name: groupName,
            suggestions: suggestions
          },
          confidence_score: suggestions.suggestions.reduce((avg, s) => avg + s.confidence, 0) / suggestions.suggestions.length,
          status: 'pending'
        });
    } catch (error) {
      console.error('Failed to store AI suggestion:', error);
      // Continue without storing
    }

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-group-categories function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: [],
      total_suggested_budget: 0,
      analysis: 'حدث خطأ في الحصول على الاقتراحات'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});