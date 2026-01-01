import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroupAnalysis {
  groupType: string;
  spendingLevel: 'low' | 'medium' | 'high' | 'luxury';
  memberCount: number;
  currency: string;
  topCategories: string[];
  averageExpense: number;
}

interface Suggestion {
  id: string;
  type: 'hotel' | 'activity' | 'esim' | 'car_rental' | 'restaurant';
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price?: number;
  priceRange?: string;
  currency?: string;
  rating?: number;
  affiliateUrl?: string;
  imageUrl?: string;
  partnerId?: string;
  partnerName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { group_id, city, destination } = await req.json();

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Analyze group behavior
    const analysis = await analyzeGroup(supabase, group_id);
    console.log('Group analysis:', analysis);

    // Fetch active partners
    const { data: partners } = await supabase
      .from('affiliate_partners')
      .select('*')
      .eq('is_active', true);

    // Generate suggestions based on analysis
    const suggestions: { hotels: Suggestion[], activities: Suggestion[], esim: Suggestion | null, carRental: Suggestion | null } = {
      hotels: [],
      activities: [],
      esim: null,
      carRental: null
    };

    // Get hotels (3 options)
    if (destination || city) {
      const hotelPartner = partners?.find(p => p.partner_type === 'hotels');
      suggestions.hotels = await getHotelSuggestions(
        destination || city,
        analysis.spendingLevel,
        analysis.memberCount,
        hotelPartner
      );
    }

    // Get activities (2-3 options)
    if (city) {
      const activityPartner = partners?.find(p => p.partner_type === 'activities');
      suggestions.activities = await getActivitySuggestions(
        city,
        analysis.groupType,
        analysis.spendingLevel,
        activityPartner
      );
    }

    // Get eSIM (1 option) - for travel groups
    if (analysis.groupType === 'travel' || analysis.groupType === 'trip') {
      const esimPartner = partners?.find(p => p.partner_type === 'esim');
      suggestions.esim = await getEsimSuggestion(destination || city, esimPartner);
    }

    // Get car rental (1 option)
    if (destination || city) {
      const carPartner = partners?.find(p => p.partner_type === 'car_rental');
      suggestions.carRental = await getCarRentalSuggestion(
        destination || city,
        analysis.memberCount,
        carPartner
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        suggestions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in smart-group-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeGroup(supabase: any, groupId: string): Promise<GroupAnalysis> {
  // Get group info
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  // Get member count
  const { count: memberCount } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  // Get expenses to analyze spending
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category_id, categories(name_ar)')
    .eq('group_id', groupId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate spending level
  let totalSpent = 0;
  const categoryCount: Record<string, number> = {};
  
  if (expenses && expenses.length > 0) {
    for (const exp of expenses) {
      totalSpent += exp.amount;
      const catName = exp.categories?.name_ar || 'أخرى';
      categoryCount[catName] = (categoryCount[catName] || 0) + 1;
    }
  }

  const avgExpense = expenses?.length ? totalSpent / expenses.length : 0;
  
  // Determine spending level
  let spendingLevel: 'low' | 'medium' | 'high' | 'luxury' = 'medium';
  if (avgExpense < 50) spendingLevel = 'low';
  else if (avgExpense < 200) spendingLevel = 'medium';
  else if (avgExpense < 500) spendingLevel = 'high';
  else spendingLevel = 'luxury';

  // Get top categories
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  return {
    groupType: group?.group_type || 'general',
    spendingLevel,
    memberCount: memberCount || 2,
    currency: group?.currency || 'SAR',
    topCategories,
    averageExpense: avgExpense
  };
}

async function getHotelSuggestions(
  destination: string,
  spendingLevel: string,
  guests: number,
  partner?: any
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  // Try Travelpayouts if configured
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (token) {
    try {
      const checkIn = new Date().toISOString().split('T')[0];
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 2);
      const checkOut = checkOutDate.toISOString().split('T')[0];

      const url = `https://engine.hotellook.com/api/v2/cache.json?location=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&limit=3&token=${token}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const hotels = await response.json();
        
        if (Array.isArray(hotels)) {
          for (const hotel of hotels.slice(0, 3)) {
            suggestions.push({
              id: `hotel_${hotel.hotelId}`,
              type: 'hotel',
              name: hotel.hotelName,
              description: `فندق ${hotel.stars} نجوم`,
              descriptionAr: `فندق ${hotel.stars} نجوم`,
              price: hotel.priceFrom,
              currency: 'USD',
              rating: hotel.stars,
              affiliateUrl: `https://search.hotellook.com/hotels?destination=${encodeURIComponent(destination)}&hotelId=${hotel.hotelId}&marker=${token}`,
              imageUrl: hotel.photoUrl,
              partnerId: partner?.id,
              partnerName: 'Travelpayouts'
            });
          }
        }
      }
    } catch (e) {
      console.error('Error fetching hotels:', e);
    }
  }

  // Fallback: generate placeholder suggestions based on spending level
  if (suggestions.length === 0) {
    const priceRanges = {
      low: { min: 100, max: 200, stars: 3 },
      medium: { min: 200, max: 400, stars: 4 },
      high: { min: 400, max: 800, stars: 4 },
      luxury: { min: 800, max: 2000, stars: 5 }
    };
    
    const range = priceRanges[spendingLevel as keyof typeof priceRanges] || priceRanges.medium;
    
    for (let i = 1; i <= 3; i++) {
      suggestions.push({
        id: `hotel_placeholder_${i}`,
        type: 'hotel',
        name: `فندق ${destination} ${i}`,
        nameAr: `فندق ${destination} ${i}`,
        description: `فندق ${range.stars} نجوم في ${destination}`,
        descriptionAr: `فندق ${range.stars} نجوم في ${destination}`,
        priceRange: `${range.min}-${range.max} USD`,
        rating: range.stars,
        partnerId: partner?.id
      });
    }
  }

  return suggestions;
}

async function getActivitySuggestions(
  city: string,
  groupType: string,
  spendingLevel: string,
  partner?: any
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  // Activity suggestions based on group type
  const activityTypes: Record<string, string[]> = {
    travel: ['جولة سياحية', 'زيارة معالم', 'تجربة محلية'],
    trip: ['جولة سياحية', 'مغامرة', 'تجربة طعام'],
    friends: ['نشاط ترفيهي', 'مطعم', 'كافيه'],
    family: ['حديقة', 'متحف', 'نشاط عائلي'],
    work: ['اجتماع عمل', 'مطعم راقي', 'جولة تعريفية'],
    general: ['نشاط ترفيهي', 'مطعم', 'جولة']
  };

  const activities = activityTypes[groupType] || activityTypes.general;
  
  for (let i = 0; i < activities.length; i++) {
    suggestions.push({
      id: `activity_${i + 1}`,
      type: 'activity',
      name: `${activities[i]} في ${city}`,
      nameAr: `${activities[i]} في ${city}`,
      description: `اكتشف أفضل ${activities[i]} في ${city}`,
      descriptionAr: `اكتشف أفضل ${activities[i]} في ${city}`,
      priceRange: spendingLevel === 'luxury' ? '$$$$' : spendingLevel === 'high' ? '$$$' : '$$',
      partnerId: partner?.id,
      partnerName: partner?.name
    });
  }

  return suggestions;
}

async function getEsimSuggestion(destination: string, partner?: any): Promise<Suggestion | null> {
  // eSIM suggestion for international travel
  return {
    id: 'esim_1',
    type: 'esim',
    name: `شريحة eSIM لـ ${destination}`,
    nameAr: `شريحة eSIM لـ ${destination}`,
    description: 'إنترنت سريع بدون تجوال',
    descriptionAr: 'إنترنت سريع بدون تجوال - تفعيل فوري',
    priceRange: '$10-30',
    partnerId: partner?.id,
    partnerName: partner?.name || 'Airalo',
    affiliateUrl: partner?.config?.base_url || 'https://www.airalo.com'
  };
}

async function getCarRentalSuggestion(
  destination: string,
  passengers: number,
  partner?: any
): Promise<Suggestion | null> {
  const carType = passengers > 5 ? 'SUV / Van' : passengers > 3 ? 'SUV' : 'سيارة صغيرة';
  
  return {
    id: 'car_1',
    type: 'car_rental',
    name: `تأجير ${carType} في ${destination}`,
    nameAr: `تأجير ${carType} في ${destination}`,
    description: `مناسب لـ ${passengers} أشخاص`,
    descriptionAr: `سيارة مناسبة لـ ${passengers} أشخاص`,
    priceRange: passengers > 5 ? '$80-150/يوم' : '$40-80/يوم',
    partnerId: partner?.id,
    partnerName: partner?.name || 'Localrent',
    affiliateUrl: partner?.config?.base_url || 'https://localrent.com'
  };
}
