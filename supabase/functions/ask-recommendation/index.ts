import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AskRequest {
  group_id?: string;
  request_type: 'hotel' | 'restaurant' | 'activity' | 'transport';
  preferences: {
    budget?: 'low' | 'medium' | 'high' | 'luxury';
    distance?: 'near' | 'medium' | 'far';
    has_children?: boolean;
    timing?: 'morning' | 'afternoon' | 'evening' | 'night';
    city?: string;
    special_requirements?: string;
  };
}

interface Recommendation {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  rating: number;
  priceRange: string;
  estimatedPrice?: number;
  currency: string;
  description: string;
  descriptionAr: string;
  address?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  relevanceReason: string;
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

    const body: AskRequest = await req.json();
    const { group_id, request_type, preferences } = body;

    if (!request_type) {
      return new Response(
        JSON.stringify({ error: 'request_type is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get group info if provided
    let groupInfo = null;
    let city = preferences.city;
    
    if (group_id) {
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('id', group_id)
        .single();
      groupInfo = group;
    }

    // Build AI prompt
    const prompt = buildPrompt(request_type, preferences, groupInfo);
    
    let recommendations: Recommendation[] = [];

    // Try AI-powered recommendations
    if (lovableApiKey) {
      try {
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
                content: `أنت مساعد توصيات سفر متخصص. قدم 3 توصيات بناءً على طلب المستخدم.
                
يجب أن تكون الإجابة بصيغة JSON فقط بالشكل التالي:
{
  "recommendations": [
    {
      "name": "اسم المكان بالإنجليزية",
      "nameAr": "اسم المكان بالعربية",
      "category": "نوع المكان",
      "rating": 4.5,
      "priceRange": "$$",
      "estimatedPrice": 150,
      "description": "وصف قصير بالإنجليزية",
      "descriptionAr": "وصف قصير بالعربية",
      "relevanceReason": "سبب التوصية بالعربية"
    }
  ]
}`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              // Extract JSON from response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
                  recommendations = parsed.recommendations.map((rec: any, index: number) => ({
                    id: `ai_rec_${Date.now()}_${index}`,
                    name: rec.name || rec.nameAr,
                    nameAr: rec.nameAr || rec.name,
                    category: rec.category || request_type,
                    rating: rec.rating || 4,
                    priceRange: rec.priceRange || '$$',
                    estimatedPrice: rec.estimatedPrice,
                    currency: 'SAR',
                    description: rec.description || '',
                    descriptionAr: rec.descriptionAr || rec.description,
                    address: rec.address,
                    relevanceReason: rec.relevanceReason || 'توصية بناءً على تفضيلاتك'
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

    // Fallback to template-based recommendations if AI fails
    if (recommendations.length === 0) {
      recommendations = generateFallbackRecommendations(request_type, preferences, city);
    }

    // Save the request
    await supabase.from('recommendation_requests').insert({
      user_id: user.id,
      group_id,
      request_type,
      preferences,
      results: recommendations,
      status: 'completed'
    });

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        source: recommendations[0]?.id.startsWith('ai_') ? 'ai' : 'fallback'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ask-recommendation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildPrompt(
  requestType: string,
  preferences: AskRequest['preferences'],
  groupInfo: any
): string {
  const typeLabels: Record<string, string> = {
    hotel: 'فندق',
    restaurant: 'مطعم',
    activity: 'نشاط ترفيهي',
    transport: 'وسيلة مواصلات'
  };

  const budgetLabels: Record<string, string> = {
    low: 'اقتصادي',
    medium: 'متوسط',
    high: 'فاخر',
    luxury: 'فخم جداً'
  };

  const timingLabels: Record<string, string> = {
    morning: 'صباحاً',
    afternoon: 'بعد الظهر',
    evening: 'مساءً',
    night: 'ليلاً'
  };

  let prompt = `أريد ${typeLabels[requestType] || requestType}`;
  
  if (preferences.city) {
    prompt += ` في ${preferences.city}`;
  }
  
  if (preferences.budget) {
    prompt += `. الميزانية: ${budgetLabels[preferences.budget]}`;
  }
  
  if (preferences.has_children) {
    prompt += `. مناسب للأطفال`;
  }
  
  if (preferences.timing) {
    prompt += `. التوقيت: ${timingLabels[preferences.timing]}`;
  }
  
  if (preferences.distance) {
    const distanceLabels: Record<string, string> = {
      near: 'قريب',
      medium: 'مسافة متوسطة',
      far: 'لا يهم المسافة'
    };
    prompt += `. المسافة: ${distanceLabels[preferences.distance]}`;
  }
  
  if (preferences.special_requirements) {
    prompt += `. ملاحظات إضافية: ${preferences.special_requirements}`;
  }

  if (groupInfo) {
    prompt += `. نوع المجموعة: ${groupInfo.group_type || 'عام'}`;
  }

  prompt += `\n\nقدم 3 اقتراحات محددة مع تفاصيل دقيقة.`;

  return prompt;
}

function generateFallbackRecommendations(
  requestType: string,
  preferences: AskRequest['preferences'],
  city?: string
): Recommendation[] {
  const cityName = city || 'الرياض';
  
  const templates: Record<string, Recommendation[]> = {
    hotel: [
      {
        id: 'fallback_hotel_1',
        name: 'Luxury Hotel',
        nameAr: `فندق فاخر في ${cityName}`,
        category: 'hotel',
        rating: 5,
        priceRange: '$$$',
        estimatedPrice: 500,
        currency: 'SAR',
        description: 'A luxury 5-star hotel with excellent amenities',
        descriptionAr: 'فندق 5 نجوم فاخر مع خدمات ممتازة',
        relevanceReason: 'فندق راقي يناسب تفضيلاتك'
      },
      {
        id: 'fallback_hotel_2',
        name: 'Business Hotel',
        nameAr: `فندق رجال الأعمال في ${cityName}`,
        category: 'hotel',
        rating: 4,
        priceRange: '$$',
        estimatedPrice: 300,
        currency: 'SAR',
        description: 'Modern business hotel with meeting facilities',
        descriptionAr: 'فندق عصري مع قاعات اجتماعات',
        relevanceReason: 'موقع مركزي وخدمات ممتازة'
      },
      {
        id: 'fallback_hotel_3',
        name: 'Budget Hotel',
        nameAr: `فندق اقتصادي في ${cityName}`,
        category: 'hotel',
        rating: 3,
        priceRange: '$',
        estimatedPrice: 150,
        currency: 'SAR',
        description: 'Comfortable budget-friendly accommodation',
        descriptionAr: 'إقامة مريحة بأسعار معقولة',
        relevanceReason: 'خيار اقتصادي ونظيف'
      }
    ],
    restaurant: [
      {
        id: 'fallback_restaurant_1',
        name: 'Fine Dining Restaurant',
        nameAr: `مطعم راقي في ${cityName}`,
        category: 'restaurant',
        rating: 5,
        priceRange: '$$$',
        estimatedPrice: 200,
        currency: 'SAR',
        description: 'Exquisite dining experience with international cuisine',
        descriptionAr: 'تجربة طعام استثنائية مع مأكولات عالمية',
        relevanceReason: 'أفضل مطعم للمناسبات الخاصة'
      },
      {
        id: 'fallback_restaurant_2',
        name: 'Local Cuisine Restaurant',
        nameAr: `مطعم مأكولات محلية في ${cityName}`,
        category: 'restaurant',
        rating: 4,
        priceRange: '$$',
        estimatedPrice: 100,
        currency: 'SAR',
        description: 'Authentic local dishes and traditional atmosphere',
        descriptionAr: 'أطباق محلية أصيلة وأجواء تراثية',
        relevanceReason: 'لتجربة الطعام المحلي الأصيل'
      },
      {
        id: 'fallback_restaurant_3',
        name: 'Family Restaurant',
        nameAr: `مطعم عائلي في ${cityName}`,
        category: 'restaurant',
        rating: 4,
        priceRange: '$$',
        estimatedPrice: 80,
        currency: 'SAR',
        description: 'Family-friendly restaurant with diverse menu',
        descriptionAr: 'مطعم عائلي مع قائمة متنوعة',
        relevanceReason: 'مناسب للعائلات والأطفال'
      }
    ],
    activity: [
      {
        id: 'fallback_activity_1',
        name: 'City Tour',
        nameAr: `جولة سياحية في ${cityName}`,
        category: 'activity',
        rating: 5,
        priceRange: '$$',
        estimatedPrice: 150,
        currency: 'SAR',
        description: 'Guided tour of major attractions',
        descriptionAr: 'جولة مع مرشد سياحي لأهم المعالم',
        relevanceReason: 'أفضل طريقة لاستكشاف المدينة'
      },
      {
        id: 'fallback_activity_2',
        name: 'Adventure Experience',
        nameAr: `تجربة مغامرة في ${cityName}`,
        category: 'activity',
        rating: 4,
        priceRange: '$$',
        estimatedPrice: 200,
        currency: 'SAR',
        description: 'Exciting outdoor adventure activities',
        descriptionAr: 'أنشطة مغامرة مثيرة في الهواء الطلق',
        relevanceReason: 'لمحبي الإثارة والمغامرة'
      },
      {
        id: 'fallback_activity_3',
        name: 'Cultural Experience',
        nameAr: `تجربة ثقافية في ${cityName}`,
        category: 'activity',
        rating: 4,
        priceRange: '$',
        estimatedPrice: 80,
        currency: 'SAR',
        description: 'Immersive cultural and heritage experience',
        descriptionAr: 'تجربة ثقافية وتراثية غنية',
        relevanceReason: 'للتعرف على الثقافة المحلية'
      }
    ],
    transport: [
      {
        id: 'fallback_transport_1',
        name: 'Private Car Service',
        nameAr: 'خدمة سيارة خاصة',
        category: 'transport',
        rating: 5,
        priceRange: '$$$',
        estimatedPrice: 300,
        currency: 'SAR',
        description: 'Premium private car with driver',
        descriptionAr: 'سيارة خاصة فاخرة مع سائق',
        relevanceReason: 'راحة وخصوصية تامة'
      },
      {
        id: 'fallback_transport_2',
        name: 'Car Rental',
        nameAr: 'تأجير سيارة',
        category: 'transport',
        rating: 4,
        priceRange: '$$',
        estimatedPrice: 150,
        currency: 'SAR',
        description: 'Self-drive car rental',
        descriptionAr: 'استئجار سيارة للقيادة الذاتية',
        relevanceReason: 'حرية التنقل في أي وقت'
      },
      {
        id: 'fallback_transport_3',
        name: 'Ride-hailing Service',
        nameAr: 'خدمة توصيل',
        category: 'transport',
        rating: 4,
        priceRange: '$',
        estimatedPrice: 50,
        currency: 'SAR',
        description: 'Convenient ride-hailing service',
        descriptionAr: 'خدمة توصيل سريعة ومريحة',
        relevanceReason: 'خيار اقتصادي وسهل'
      }
    ]
  };

  return templates[requestType] || templates.activity;
}
