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
  userBehavior?: {
    userType: string;
    engagementLevel: string;
    preferredCategories: string[];
    recentExpenseCategories: string[];
    groupTypes: string[];
    averageExpenseAmount?: number;
    location?: string;
  };
  smartMode?: boolean;
  groupContext?: {
    groupType: string;
    currency: string;
    memberCount: number;
    totalExpenses: number;
  };
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
      region: 'me-south-1',
      marketplace: 'www.amazon.sa',
      endpoint: 'webservices.amazon.sa',
      currency: 'SAR'
    };

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

    console.log('Request body:', requestBody);

    // Smart AI-powered product selection
    if (requestBody.smartMode && requestBody.userBehavior) {
      const smartProducts = await getSmartProductRecommendations(
        supabase, 
        requestBody.userBehavior, 
        requestBody.groupContext,
        requestBody.limit || 10
      );
      
      if (smartProducts.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            products: smartProducts,
            source: 'smart_recommendations',
            message: `تم جلب ${smartProducts.length} منتج بناءً على الذكاء الاصطناعي`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // بناء طلب البحث الأساسي
    const searchRequest = {
      SearchIndex: 'All',
      Keywords: requestBody.keywords?.join(' ') || 'general',
      ItemCount: requestBody.limit || 10,
      AssociateTag: amazonConfig.associateId,
      MinPrice: requestBody.minPrice ? requestBody.minPrice * 100 : undefined,
      MaxPrice: requestBody.maxPrice ? requestBody.maxPrice * 100 : undefined,
      ResponseGroup: 'ItemAttributes,Offers,Images,Reviews'
    };

    // إنشاء توقيع الطلب
    const timestamp = new Date().toISOString();
    const canonicalQueryString = Object.entries(searchRequest)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .sort()
      .join('&');

    const stringToSign = [
      'GET',
      amazonConfig.endpoint,
      '/onca/xml',
      canonicalQueryString
    ].join('\n');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(amazonConfig.secretKey);
    const algorithm = { name: 'HMAC', hash: 'SHA-256' };
    
    const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const finalUrl = `https://${amazonConfig.endpoint}/onca/xml?${canonicalQueryString}&Signature=${encodeURIComponent(signatureBase64)}`;

    console.log('Making request to Amazon API:', finalUrl);

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

    const products = parseAmazonXML(amazonData);

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
      conversion_rate: calculateInitialConversionRate(product, requestBody.userBehavior),
      commission_rate: 0.08,
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

// Smart AI-powered product recommendations
async function getSmartProductRecommendations(
  supabase: any, 
  userBehavior: any, 
  groupContext: any,
  limit: number
): Promise<any[]> {
  try {
    console.log('Getting smart recommendations for:', userBehavior, groupContext);
    
    // Priority scoring system based on user type
    const categoryScoring: Record<string, string[]> = {
      'saver': ['home', 'kitchen', 'books', 'health', 'education'],
      'social': ['entertainment', 'travel', 'fashion', 'sports', 'games'],
      'organizer': ['office', 'electronics', 'organization', 'productivity'],
      'beginner': ['general', 'popular', 'trending', 'budget']
    };

    // Map group types to product categories
    const groupCategoryMapping: Record<string, string[]> = {
      'trip': ['travel', 'luggage', 'electronics', 'outdoor', 'camera'],
      'home': ['home', 'kitchen', 'furniture', 'decor', 'appliances'],
      'work': ['office', 'electronics', 'books', 'productivity', 'software'],
      'party': ['entertainment', 'food', 'decoration', 'games', 'music'],
      'project': ['tools', 'electronics', 'office', 'organization', 'supplies'],
      'general': ['popular', 'trending', 'electronics', 'home', 'fashion']
    };

    // Get preferred categories based on user type
    const preferredCategories = categoryScoring[userBehavior.userType] || ['general'];
    
    // Add categories based on group types
    const groupCategories = userBehavior.groupTypes
      .flatMap((groupType: string) => groupCategoryMapping[groupType] || []);
    
    // Add current group context
    if (groupContext?.groupType) {
      const contextCategories = groupCategoryMapping[groupContext.groupType] || [];
      groupCategories.push(...contextCategories);
    }
    
    // Combine and prioritize categories
    const allCategories = [...preferredCategories, ...groupCategories, ...userBehavior.preferredCategories];
    const uniqueCategories = [...new Set(allCategories)];

    console.log('Unique categories for recommendations:', uniqueCategories);

    // Build complex query for smart recommendations
    let query = supabase
      .from('affiliate_products')
      .select('*')
      .eq('active', true)
      .eq('affiliate_partner', 'amazon');

    // Filter by preferred categories if available
    if (uniqueCategories.length > 0) {
      query = query.in('category', uniqueCategories.slice(0, 5));
    }

    // Apply engagement-based filtering
    if (userBehavior.engagementLevel === 'high') {
      query = query.gte('conversion_rate', 0.05);
    } else if (userBehavior.engagementLevel === 'low') {
      query = query.lte('price_range', 'متوسط');
    }

    const { data: products, error } = await query
      .order('conversion_rate', { ascending: false })
      .limit(limit * 2); // Get more products for better filtering

    if (error) {
      console.error('Error fetching smart recommendations:', error);
      return [];
    }

    console.log(`Found ${products?.length || 0} smart recommendations`);

    // Apply AI scoring and ranking
    const scoredProducts = products?.map(product => ({
      ...product,
      smart_score: calculateSmartScore(product, userBehavior, groupContext)
    })) || [];

    // Sort by smart score and return top products
    return scoredProducts
      .sort((a, b) => b.smart_score - a.smart_score)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in smart recommendations:', error);
    return [];
  }
}

// Calculate smart score for product ranking
function calculateSmartScore(product: any, userBehavior: any, groupContext?: any): number {
  let score = 0;
  
  // Base score from conversion rate
  score += (product.conversion_rate || 0) * 10;
  
  // User type matching bonus
  const userTypeBonus: Record<string, string[]> = {
    'saver': ['home', 'kitchen', 'books', 'health'],
    'social': ['entertainment', 'travel', 'fashion', 'sports'],
    'organizer': ['office', 'electronics', 'organization', 'productivity'],
    'beginner': ['popular', 'general', 'trending']
  };
  
  if (userTypeBonus[userBehavior.userType]?.includes(product.category)) {
    score += 5;
  }
  
  // Recent expense categories matching
  if (userBehavior.recentExpenseCategories?.includes(product.category)) {
    score += 3;
  }
  
  // Group context bonus
  if (groupContext) {
    const groupCategoryMapping: Record<string, string[]> = {
      'trip': ['travel', 'luggage', 'electronics', 'outdoor'],
      'home': ['home', 'kitchen', 'furniture', 'decor'],
      'work': ['office', 'electronics', 'books', 'productivity'],
      'party': ['entertainment', 'food', 'decoration', 'games'],
      'project': ['tools', 'electronics', 'office', 'organization']
    };
    
    if (groupCategoryMapping[groupContext.groupType]?.includes(product.category)) {
      score += 4;
    }
    
    // Member count bonus (more members = higher engagement products)
    if (groupContext.memberCount > 5 && userBehavior.engagementLevel === 'high') {
      score += 2;
    }
  }
  
  // Engagement level adjustments
  if (userBehavior.engagementLevel === 'high') {
    score += (product.commission_rate || 0) * 2;
  }
  
  // Rating bonus
  if (product.rating && product.rating > 4) {
    score += 2;
  }
  
  // Price range matching for user behavior
  if (userBehavior.averageExpenseAmount) {
    const priceMapping: Record<string, number> = {
      'منخفض': 100,
      'متوسط': 500,
      'مرتفع': 1000
    };
    
    const productPriceLevel = priceMapping[product.price_range] || 300;
    const userPriceLevel = userBehavior.averageExpenseAmount;
    
    // Bonus for matching price expectations
    if (Math.abs(productPriceLevel - userPriceLevel) < userPriceLevel * 0.5) {
      score += 3;
    }
  }
  
  // Keywords matching bonus
  const keywords = product.keywords || [];
  const matchingKeywords = keywords.filter((keyword: string) => 
    userBehavior.preferredCategories?.includes(keyword) ||
    userBehavior.recentExpenseCategories?.includes(keyword)
  );
  score += matchingKeywords.length * 0.5;
  
  // Location-based bonus (if applicable)
  if (userBehavior.location === 'saudi' && product.affiliate_partner === 'amazon') {
    score += 1; // Small bonus for local relevance
  }
  
  return score;
}

// Calculate initial conversion rate based on user behavior
function calculateInitialConversionRate(product: any, userBehavior?: any): number {
  let baseRate = 0.05; // 5% default
  
  if (!userBehavior) return baseRate;
  
  // Higher conversion for engaged users
  if (userBehavior.engagementLevel === 'high') {
    baseRate += 0.02;
  }
  
  // Higher conversion for matching categories
  if (userBehavior.preferredCategories?.includes(product.category)) {
    baseRate += 0.01;
  }
  
  // Rating impact
  if (product.rating > 4) {
    baseRate += 0.01;
  }
  
  return Math.min(baseRate, 0.15); // Cap at 15%
}

// دالة مبسطة لتحليل XML من Amazon
function parseAmazonXML(xmlString: string) {
  const products = [];
  
  try {
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
          title: title.substring(0, 200),
          description: extractXMLValue(itemXml, 'Feature') || title.substring(0, 500),
          priceRange: priceText || 'غير محدد',
          rating: rating ? parseFloat(rating) : null,
          imageUrl: imageUrl || null,
          affiliateUrl: detailPageURL || `https://amazon.sa/dp/${asin}?tag=${Deno.env.get('AMAZON_ASSOCIATE_ID')}`
        });
      }
    }
  } catch (error) {
    console.error('XML parsing error:', error);
  }
  
  return products;
}

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