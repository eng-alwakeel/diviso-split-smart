import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmazonProductRequest {
  categoryId?: string;
  keywords?: string[];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const amazonConfig = {
      associateId: Deno.env.get('AMAZON_ASSOCIATE_ID'),
      accessKey: Deno.env.get('AMAZON_ACCESS_KEY'),
      secretKey: Deno.env.get('AMAZON_SECRET_KEY'),
      region: 'us-east-1', // يمكن تغييرها حسب المنطقة
      endpoint: 'webservices.amazon.com'
    };

    // التحقق من وجود جميع المفاتيح المطلوبة
    if (!amazonConfig.associateId || !amazonConfig.accessKey || !amazonConfig.secretKey) {
      return new Response(
        JSON.stringify({ error: 'Amazon credentials not configured' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let requestBody: AmazonProductRequest = {};
    if (req.method === 'POST') {
      requestBody = await req.json();
    }

    // بناء طلب البحث الأساسي
    const searchRequest = {
      SearchIndex: 'All',
      Keywords: requestBody.keywords?.join(' ') || 'general',
      ItemCount: requestBody.limit || 10,
      AssociateTag: amazonConfig.associateId,
      MinPrice: requestBody.minPrice ? requestBody.minPrice * 100 : undefined, // Amazon expects price in cents
      MaxPrice: requestBody.maxPrice ? requestBody.maxPrice * 100 : undefined,
      ResponseGroup: 'ItemAttributes,Offers,Images,Reviews'
    };

    // إنشاء توقيع الطلب (Amazon Product Advertising API v5)
    const timestamp = new Date().toISOString();
    const canonicalQueryString = Object.entries(searchRequest)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .sort()
      .join('&');

    // تشفير الطلب
    const stringToSign = [
      'GET',
      amazonConfig.endpoint,
      '/onca/xml',
      canonicalQueryString
    ].join('\n');

    // إنشاء التوقيع باستخدام HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(amazonConfig.secretKey);
    const algorithm = { name: 'HMAC', hash: 'SHA-256' };
    
    const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // بناء URL النهائي
    const finalUrl = `https://${amazonConfig.endpoint}/onca/xml?${canonicalQueryString}&Signature=${encodeURIComponent(signatureBase64)}`;

    console.log('Making request to Amazon API:', finalUrl);

    // إرسال الطلب لـ Amazon
    const amazonResponse = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Expense-Tracker-App/1.0'
      }
    });

    if (!amazonResponse.ok) {
      console.error('Amazon API error:', amazonResponse.status, await amazonResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Amazon API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const amazonData = await amazonResponse.text();
    console.log('Amazon API response received');

    // تحليل XML response (مبسط - في التطبيق الحقيقي نحتاج parser أفضل)
    const products = parseAmazonXML(amazonData);

    // حفظ المنتجات في قاعدة البيانات
    const productsToSave = products.map(product => ({
      product_id: product.asin,
      affiliate_partner: 'amazon',
      category: requestBody.categoryId || 'general',
      title: product.title,
      description: product.description,
      price_range: product.priceRange,
      rating: product.rating,
      image_url: product.imageUrl,
      affiliate_url: product.affiliateUrl,
      keywords: requestBody.keywords || ['general'],
      conversion_rate: 0.05, // معدل تحويل افتراضي
      commission_rate: 0.08, // معدل عمولة افتراضي
      active: true
    }));

    if (productsToSave.length > 0) {
      const { error: insertError } = await supabase
        .from('affiliate_products')
        .upsert(productsToSave, { 
          onConflict: 'product_id,affiliate_partner',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save products to database' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        productsFound: products.length,
        productsSaved: productsToSave.length,
        products: products
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// دالة مبسطة لتحليل XML من Amazon
function parseAmazonXML(xmlString: string) {
  const products = [];
  
  try {
    // تحليل مبسط للـ XML - في التطبيق الحقيقي نحتاج parser أكثر تطوراً
    const itemMatches = xmlString.match(/<Item>[\s\S]*?<\/Item>/g) || [];
    
    for (const itemXml of itemMatches) {
      const asin = extractXMLValue(itemXml, 'ASIN');
      const title = extractXMLValue(itemXml, 'Title');
      const detailPageURL = extractXMLValue(itemXml, 'DetailPageURL');
      const imageUrl = extractXMLValue(itemXml, 'LargeImage', 'URL') || extractXMLValue(itemXml, 'MediumImage', 'URL');
      const priceText = extractXMLValue(itemXml, 'FormattedPrice');
      const rating = extractXMLValue(itemXml, 'AverageRating');
      
      if (asin && title) {
        products.push({
          asin,
          title: title.substring(0, 200), // تحديد طول العنوان
          description: extractXMLValue(itemXml, 'Feature') || title.substring(0, 500),
          priceRange: priceText || 'غير محدد',
          rating: rating ? parseFloat(rating) : null,
          imageUrl: imageUrl || null,
          affiliateUrl: detailPageURL || `https://amazon.com/dp/${asin}?tag=${Deno.env.get('AMAZON_ASSOCIATE_ID')}`
        });
      }
    }
  } catch (error) {
    console.error('XML parsing error:', error);
  }
  
  return products;
}

// دالة مساعدة لاستخراج قيم من XML
function extractXMLValue(xml: string, tag: string, nestedTag?: string): string | null {
  try {
    const pattern = nestedTag 
      ? new RegExp(`<${tag}[^>]*>[\\s\\S]*?<${nestedTag}[^>]*>([\\s\\S]*?)<\\/${nestedTag}>`, 'i')
      : new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    
    const match = xml.match(pattern);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}