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
    const { file_path, receipt_id } = await req.json();
    
    if (!file_path) {
      throw new Error('file_path is required');
    }

    console.log('Processing receipt with enhanced OCR:', { file_path, receipt_id });

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

    // Update status to processing
    if (receipt_id) {
      await supabase
        .from('receipt_ocr')
        .update({ processing_status: 'processing' })
        .eq('id', receipt_id);
    }

    // Download the image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('receipts')
      .download(file_path);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert to base64
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call OpenAI GPT-4 Vision for enhanced analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `أنت محلل ذكي للإيصالات. قم بتحليل الإيصال واستخراج المعلومات التالية بدقة:
- اسم التاجر/المتجر
- إجمالي المبلغ (رقم فقط)
- ضريبة القيمة المضافة إن وجدت
- تاريخ المعاملة (بتنسيق YYYY-MM-DD)
- العملة (SAR, USD, EUR, إلخ)
- قائمة العناصر المشتراة مع الكميات والأسعار
- اقتراح فئة المصروف (طعام، مواصلات، تسوق، إلخ)
- نوع المعاملة (شراء، خدمة، إلخ)

أرجع النتيجة بتنسيق JSON صحيح باللغة العربية.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'حلل هذا الإيصال واستخرج جميع المعلومات المطلوبة:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
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
    
    console.log('OpenAI analysis result:', analysisText);

    // Parse the JSON response from OpenAI
    let analysis;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback: create structured data from text
      analysis = {
        merchant: 'غير محدد',
        total: null,
        currency: 'SAR',
        date: null,
        category_suggestion: 'عام',
        confidence: 0.5,
        raw_analysis: analysisText
      };
    }

    // Calculate confidence scores for each field
    const confidenceScores = {
      merchant: analysis.merchant ? 0.9 : 0.1,
      total: analysis.total ? 0.95 : 0.1,
      currency: analysis.currency ? 0.9 : 0.7,
      date: analysis.date ? 0.8 : 0.1,
      category: analysis.category_suggestion ? 0.8 : 0.3
    };

    // Find matching category if exists
    let suggestedCategoryId = null;
    if (analysis.category_suggestion) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name_ar')
        .ilike('name_ar', `%${analysis.category_suggestion}%`)
        .limit(1);
      
      if (categories && categories.length > 0) {
        suggestedCategoryId = categories[0].id;
      }
    }

    // Update or create receipt_ocr record
    const receiptData = {
      merchant: analysis.merchant || null,
      total: analysis.total ? parseFloat(analysis.total) : null,
      currency: analysis.currency || 'SAR',
      receipt_date: analysis.date || null,
      vat: analysis.vat ? parseFloat(analysis.vat) : null,
      raw_text: analysis.raw_text || analysisText,
      ai_analysis: analysis,
      confidence_scores: confidenceScores,
      suggested_category_id: suggestedCategoryId,
      items: analysis.items || [],
      processing_status: 'completed',
      created_by: user.id,
      storage_path: file_path
    };

    let result;
    if (receipt_id) {
      // Update existing record
      const { data, error } = await supabase
        .from('receipt_ocr')
        .update(receiptData)
        .eq('id', receipt_id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('receipt_ocr')
        .insert(receiptData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    // Create AI suggestion for category if confidence is high
    if (suggestedCategoryId && confidenceScores.category > 0.7) {
      await supabase
        .from('ai_suggestions')
        .insert({
          user_id: user.id,
          suggestion_type: 'category',
          content: {
            receipt_id: result.id,
            suggested_category_id: suggestedCategoryId,
            category_name: analysis.category_suggestion,
            reason: 'تم اقتراح هذه الفئة بناءً على تحليل محتوى الإيصال'
          },
          confidence_score: confidenceScores.category
        });
    }

    console.log('Enhanced OCR processing completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhance-receipt-ocr:', error);

    // Update status to failed if receipt_id exists
    const { receipt_id } = await req.json().catch(() => ({}));
    if (receipt_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('receipt_ocr')
          .update({ processing_status: 'failed' })
          .eq('id', receipt_id);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});