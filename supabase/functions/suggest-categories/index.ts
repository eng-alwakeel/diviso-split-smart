import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, merchant, amount, group_id } = await req.json();
    
    console.log('Generating category suggestions for:', { description, merchant, amount, group_id });

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get available categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name_ar, icon')
      .or(`created_by.is.null,created_by.eq.${user.id}`)
      .order('name_ar');

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Get user's expense history for learning
    const { data: recentExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        description,
        note_ar,
        category_id,
        categories!inner(name_ar)
      `)
      .eq('created_by', user.id)
      .not('category_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (expensesError) {
      console.error('Error fetching user expenses:', expensesError);
    }

    // Prepare context for AI
    const categoryList = categories.map(cat => `${cat.name_ar} (${cat.id})`).join('\n');
    const userPatterns = recentExpenses ? 
      recentExpenses.map(exp => `"${exp.description || exp.note_ar}" -> ${exp.categories.name_ar}`).join('\n') : '';

    // Call OpenAI for intelligent categorization
    const prompt = `أنت نظام ذكي لاقتراح فئات المصروفات. بناءً على المعلومات التالية، اقترح أفضل 3 فئات مرتبة حسب الأولوية:

الوصف: ${description || 'غير محدد'}
التاجر: ${merchant || 'غير محدد'}
المبلغ: ${amount || 'غير محدد'}

الفئات المتاحة:
${categoryList}

أنماط المستخدم السابقة:
${userPatterns || 'لا توجد بيانات سابقة'}

أرجع النتيجة بتنسيق JSON كالتالي:
{
  "suggestions": [
    {
      "category_id": "uuid",
      "category_name": "اسم الفئة",
      "confidence": 0.95,
      "reason": "سبب الاقتراح"
    }
  ],
  "analysis": "تحليل مختصر للمصروف"
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في تصنيف المصروفات. قدم اقتراحات دقيقة ومفيدة باللغة العربية.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisText = openaiData.choices[0].message.content;
    
    console.log('OpenAI categorization result:', analysisText);

    // Parse the JSON response
    let aiResult;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to simple text matching
      const fallbackCategory = categories.find(cat => 
        description?.toLowerCase().includes(cat.name_ar.toLowerCase()) ||
        merchant?.toLowerCase().includes(cat.name_ar.toLowerCase())
      );
      
      aiResult = {
        suggestions: fallbackCategory ? [{
          category_id: fallbackCategory.id,
          category_name: fallbackCategory.name_ar,
          confidence: 0.6,
          reason: 'تطابق نصي بسيط'
        }] : [],
        analysis: 'فشل في التحليل الذكي، تم استخدام التطابق النصي'
      };
    }

    // Validate and filter suggestions
    const validSuggestions = aiResult.suggestions
      ?.filter(suggestion => 
        categories.some(cat => cat.id === suggestion.category_id)
      )
      .slice(0, 3) || [];

    // Store AI suggestion if confidence is high enough
    if (validSuggestions.length > 0 && validSuggestions[0].confidence > 0.7) {
      await supabase
        .from('ai_suggestions')
        .insert({
          user_id: user.id,
          suggestion_type: 'category',
          content: {
            description,
            merchant,
            amount,
            suggestions: validSuggestions,
            analysis: aiResult.analysis
          },
          confidence_score: validSuggestions[0].confidence
        });
    }

    const result = {
      suggestions: validSuggestions,
      analysis: aiResult.analysis || 'تم تحليل المصروف بنجاح',
      categories: categories // Return all categories for fallback
    };

    console.log('Category suggestion completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-categories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});