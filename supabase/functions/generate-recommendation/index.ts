import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  group_id?: string;
  city?: string;
  destination?: string;
  latitude?: number;
  longitude?: number;
  trigger: 'planning' | 'meal_time' | 'post_expense' | 'end_of_day';
  current_time?: string;
  group_type?: string;
  member_count?: number;
  check_in?: string;
  check_out?: string;
}

interface RecommendationDecision {
  should_recommend: boolean;
  recommendation_type: 'food' | 'accommodation' | 'activity' | 'hotel' | 'flight' | 'car_rental' | null;
  reason: string;
  priority: number;
  source?: 'google_places' | 'travelpayouts' | 'fallback';
}

interface TravelpayoutsHotel {
  hotelId: number;
  hotelName: string;
  stars: number;
  priceFrom: number;
  priceAvg: number;
  photoUrl?: string;
  location: {
    lat: number;
    lon: number;
  };
}

interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  rating?: number;
  priceLevel?: string;
  types?: string[];
  location?: { latitude: number; longitude: number };
  photos?: { name: string }[];
}

// Fallback recommendations for Saudi cities
const FALLBACK_RECOMMENDATIONS: Record<string, Record<string, any[]>> = {
  'Riyadh': {
    food: [
      { name: 'مطعم نجد', name_ar: 'مطعم نجد', category: 'restaurant', rating: 4.5, estimated_price: 80, price_range: '$$', relevance_reason_ar: 'مطعم شعبي سعودي مميز' },
      { name: 'مطعم القرية النجدية', name_ar: 'مطعم القرية النجدية', category: 'restaurant', rating: 4.6, estimated_price: 100, price_range: '$$', relevance_reason_ar: 'أجواء تراثية وأكل سعودي أصيل' },
    ],
    activity: [
      { name: 'بوليفارد رياض سيتي', name_ar: 'بوليفارد رياض سيتي', category: 'entertainment', rating: 4.7, estimated_price: 50, price_range: '$', relevance_reason_ar: 'منطقة ترفيهية متكاملة' },
      { name: 'حديقة الملك عبدالله', name_ar: 'حديقة الملك عبدالله', category: 'park', rating: 4.5, estimated_price: 0, price_range: '$', relevance_reason_ar: 'حديقة عائلية جميلة' },
    ],
  },
  'Jeddah': {
    food: [
      { name: 'مطعم البيك', name_ar: 'مطعم البيك', category: 'restaurant', rating: 4.4, estimated_price: 40, price_range: '$', relevance_reason_ar: 'أشهر مطاعم الوجبات السريعة في السعودية' },
      { name: 'مطعم تواصي', name_ar: 'مطعم تواصي', category: 'restaurant', rating: 4.5, estimated_price: 60, price_range: '$$', relevance_reason_ar: 'مأكولات بحرية طازجة' },
    ],
    activity: [
      { name: 'كورنيش جدة', name_ar: 'كورنيش جدة', category: 'attraction', rating: 4.6, estimated_price: 0, price_range: '$', relevance_reason_ar: 'إطلالة رائعة على البحر الأحمر' },
      { name: 'نافورة الملك فهد', name_ar: 'نافورة الملك فهد', category: 'landmark', rating: 4.7, estimated_price: 0, price_range: '$', relevance_reason_ar: 'أطول نافورة في العالم' },
    ],
  },
  'default': {
    food: [
      { name: 'مطعم محلي مميز', name_ar: 'مطعم محلي مميز', category: 'restaurant', rating: 4.3, estimated_price: 60, price_range: '$$', relevance_reason_ar: 'مطعم موصى به في المنطقة' },
    ],
    activity: [
      { name: 'جولة في المدينة', name_ar: 'جولة في المدينة', category: 'activity', rating: 4.4, estimated_price: 30, price_range: '$', relevance_reason_ar: 'استكشف المعالم المحلية' },
    ],
  },
};

// Get fallback recommendation
function getFallbackRecommendation(city: string, type: string): any {
  const cityData = FALLBACK_RECOMMENDATIONS[city] || FALLBACK_RECOMMENDATIONS['default'];
  const typeData = cityData[type] || cityData['food'] || [];
  
  if (typeData.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * typeData.length);
  const recommendation = typeData[randomIndex];
  
  return {
    id: `fallback_${Date.now()}`,
    ...recommendation,
    currency: 'SAR',
    is_partner: false,
    source: 'fallback',
  };
}

// Travelpayouts API helper
async function fetchTravelpayoutsHotels(
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2
): Promise<TravelpayoutsHotel[]> {
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (!token) {
    console.log('[generate-recommendation] TRAVELPAYOUTS_TOKEN not configured');
    return [];
  }

  try {
    const url = `https://engine.hotellook.com/api/v2/cache.json?location=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&limit=10&token=${token}`;
    
    console.log(`[generate-recommendation] Fetching Travelpayouts hotels for: ${destination}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('[generate-recommendation] Travelpayouts API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.log('[generate-recommendation] No hotels found from Travelpayouts');
      return [];
    }

    return data.map((hotel: any) => ({
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      stars: hotel.stars || 0,
      priceFrom: hotel.priceFrom,
      priceAvg: hotel.priceAvg,
      photoUrl: hotel.photoUrl,
      location: hotel.location || { lat: 0, lon: 0 }
    }));
  } catch (error) {
    console.error('[generate-recommendation] Error fetching Travelpayouts hotels:', error);
    return [];
  }
}

// Convert Travelpayouts hotel to recommendation format
function convertHotelToRecommendation(hotel: TravelpayoutsHotel, destination: string) {
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  const affiliateUrl = `https://search.hotellook.com/hotels?destination=${encodeURIComponent(destination)}&hotelId=${hotel.hotelId}&marker=${token}`;

  return {
    id: `tp_hotel_${hotel.hotelId}`,
    name: hotel.hotelName,
    category: 'hotel',
    rating: hotel.stars,
    estimated_price: hotel.priceFrom,
    currency: 'USD',
    price_range: hotel.priceFrom < 100 ? '$' : hotel.priceFrom < 200 ? '$$' : '$$$',
    location: hotel.location,
    affiliate_url: affiliateUrl,
    is_partner: true,
    source: 'travelpayouts',
    relevance_reason: `فندق ${hotel.stars} نجوم بسعر يبدأ من $${hotel.priceFrom}`,
    relevance_reason_ar: `فندق ${hotel.stars} نجوم بسعر يبدأ من $${hotel.priceFrom}`
  };
}

// Fetch places from Google Places API directly
async function fetchGooglePlaces(
  city: string,
  recommendationType: string,
  budget: string
): Promise<{ recommendation: any; alternatives: any[] } | null> {
  const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  if (!googleApiKey) {
    console.log('[generate-recommendation] GOOGLE_PLACES_API_KEY not configured, using fallback');
    return null;
  }

  try {
    // Build search query based on recommendation type
    let searchQuery = '';
    switch (recommendationType) {
      case 'food':
        searchQuery = `best restaurants for groups in ${city}`;
        break;
      case 'activity':
        searchQuery = `popular activities and attractions in ${city}`;
        break;
      case 'accommodation':
      case 'hotel':
        searchQuery = `hotels in ${city}`;
        break;
      default:
        searchQuery = `popular places in ${city}`;
    }

    // Add budget filter to query
    if (budget === 'low') {
      searchQuery += ' budget friendly affordable';
    } else if (budget === 'high') {
      searchQuery += ' luxury premium';
    }

    console.log(`[generate-recommendation] Searching Google Places: "${searchQuery}"`);

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location,places.photos'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: 'ar',
        maxResultCount: 10
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-recommendation] Google Places API error: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    const places: GooglePlace[] = data.places || [];

    console.log(`[generate-recommendation] Found ${places.length} places from Google`);

    if (places.length === 0) {
      return null;
    }

    // Score and sort places
    const scoredPlaces = places.map((place) => {
      let score = 0;
      
      // Rating score (0-5 points)
      if (place.rating) {
        score += place.rating;
      }
      
      // Price level match
      const priceLevel = place.priceLevel || 'PRICE_LEVEL_MODERATE';
      if (budget === 'low' && priceLevel === 'PRICE_LEVEL_INEXPENSIVE') score += 2;
      if (budget === 'medium' && priceLevel === 'PRICE_LEVEL_MODERATE') score += 2;
      if (budget === 'high' && (priceLevel === 'PRICE_LEVEL_EXPENSIVE' || priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE')) score += 2;

      return { place, score };
    }).sort((a, b) => b.score - a.score);

    // Convert to recommendation format
    const convertPlace = (place: GooglePlace, index: number) => {
      const priceMap: Record<string, string> = {
        'PRICE_LEVEL_FREE': '$',
        'PRICE_LEVEL_INEXPENSIVE': '$',
        'PRICE_LEVEL_MODERATE': '$$',
        'PRICE_LEVEL_EXPENSIVE': '$$$',
        'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
      };

      const estimatedPriceMap: Record<string, number> = {
        'PRICE_LEVEL_FREE': 0,
        'PRICE_LEVEL_INEXPENSIVE': 30,
        'PRICE_LEVEL_MODERATE': 75,
        'PRICE_LEVEL_EXPENSIVE': 150,
        'PRICE_LEVEL_VERY_EXPENSIVE': 300
      };

      const priceLevel = place.priceLevel || 'PRICE_LEVEL_MODERATE';

      return {
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        name_ar: place.displayName?.text,
        category: recommendationType,
        rating: place.rating || 0,
        price_range: priceMap[priceLevel] || '$$',
        estimated_price: estimatedPriceMap[priceLevel] || 75,
        currency: 'SAR',
        location: place.location ? {
          address: place.formattedAddress,
          lat: place.location.latitude,
          lng: place.location.longitude
        } : null,
        is_partner: false,
        source: 'google_places',
        relevance_reason_ar: `تقييم ${place.rating || 'غير متوفر'} - ${place.formattedAddress || city}`,
        relevance_reason: `Rating: ${place.rating || 'N/A'} - ${place.formattedAddress || city}`
      };
    };

    const mainRecommendation = convertPlace(scoredPlaces[0].place, 0);
    const alternatives = scoredPlaces.slice(1, 4).map((sp, i) => convertPlace(sp.place, i + 1));

    return {
      recommendation: mainRecommendation,
      alternatives
    };
  } catch (error) {
    console.error('[generate-recommendation] Error fetching Google Places:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const requestBody: RecommendationRequest = await req.json();
    const { group_id, city, destination, latitude, longitude, trigger, current_time, group_type, member_count = 4 } = requestBody;

    console.log(`[generate-recommendation] Starting for trigger: ${trigger}, group: ${group_id}, city: ${city}`);

    // Determine city from coordinates or use fallback
    let resolvedCity = city;
    if (!resolvedCity && latitude && longitude) {
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          resolvedCity = geoData.address?.city || geoData.address?.town || geoData.address?.state;
          console.log(`[generate-recommendation] Resolved city from coordinates: ${resolvedCity}`);
        }
      } catch (e) {
        console.log('[generate-recommendation] Reverse geocoding failed:', e);
      }
    }
    
    const DEFAULT_CITY = 'Riyadh';
    const finalCity = resolvedCity || DEFAULT_CITY;

    // Check user's recommendation limit
    const { data: canRecommend } = await supabase.rpc('check_recommendation_limit', { p_user_id: user.id });
    
    if (!canRecommend) {
      console.log('[generate-recommendation] User reached daily limit');
      return new Response(
        JSON.stringify({ 
          decision: { 
            should_recommend: false, 
            reason: 'daily_limit_reached',
            recommendation_type: null,
            priority: 0
          },
          message: 'لقد وصلت للحد اليومي من التوصيات'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's settings
    const { data: settings } = await supabase
      .from('user_recommendation_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settings && !settings.enabled) {
      console.log('[generate-recommendation] Recommendations disabled for user');
      return new Response(
        JSON.stringify({ 
          decision: { 
            should_recommend: false, 
            reason: 'recommendations_disabled',
            recommendation_type: null,
            priority: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get group info if group_id provided
    let groupMemberCount = member_count;
    let groupType = group_type;

    if (group_id) {
      const { data: group } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .eq('id', group_id)
        .single();

      if (group) {
        groupType = group.group_type || 'general';
        
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group_id);
        
        groupMemberCount = count || member_count;
        console.log(`[generate-recommendation] Group type: ${groupType}, members: ${groupMemberCount}`);
      }
    }

    // Decision engine logic
    const decision = makeRecommendationDecision(trigger, current_time, groupType);
    console.log(`[generate-recommendation] Decision:`, decision);

    if (!decision.should_recommend) {
      return new Response(
        JSON.stringify({ decision }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine budget based on group type
    let budget: 'low' | 'medium' | 'high' = 'medium';
    if (groupType === 'friends' || groupType === 'travel') {
      budget = 'medium';
    } else if (groupType === 'work' || groupType === 'business') {
      budget = 'high';
    } else if (groupType === 'family') {
      budget = 'medium';
    }

    // Check blocked categories
    if (settings?.blocked_categories?.includes(decision.recommendation_type!)) {
      return new Response(
        JSON.stringify({ 
          decision: { 
            ...decision, 
            should_recommend: false, 
            reason: 'category_blocked' 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Travelpayouts for accommodation/hotel recommendations
    if ((decision.recommendation_type === 'accommodation' || decision.recommendation_type === 'hotel') && destination) {
      console.log('[generate-recommendation] Trying Travelpayouts for hotel...');
      
      const checkIn = requestBody.check_in || new Date().toISOString().split('T')[0];
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      const checkOut = requestBody.check_out || checkOutDate.toISOString().split('T')[0];
      
      const hotels = await fetchTravelpayoutsHotels(destination, checkIn, checkOut, groupMemberCount);
      
      if (hotels.length > 0) {
        console.log(`[generate-recommendation] Found ${hotels.length} hotels from Travelpayouts`);
        
        const mainHotel = hotels[0];
        const recommendation = convertHotelToRecommendation(mainHotel, destination);
        
        // Save recommendation to database
        await supabase.from('recommendations').insert({
          user_id: user.id,
          group_id: group_id,
          name: recommendation.name,
          recommendation_type: 'hotel',
          category: 'hotel',
          estimated_price: recommendation.estimated_price,
          currency: 'USD',
          price_range: recommendation.price_range,
          rating: recommendation.rating,
          affiliate_url: recommendation.affiliate_url,
          is_partner: true,
          source: 'travelpayouts',
          relevance_reason: recommendation.relevance_reason,
          relevance_reason_ar: recommendation.relevance_reason_ar,
          external_id: recommendation.id,
          location: recommendation.location,
          context: { trigger, group_type: groupType }
        });

        return new Response(
          JSON.stringify({ 
            decision: { ...decision, source: 'travelpayouts' },
            recommendation,
            alternatives: hotels.slice(1, 4).map(h => convertHotelToRecommendation(h, destination))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Try Google Places API directly
    console.log(`[generate-recommendation] Trying Google Places for ${decision.recommendation_type} in ${finalCity}...`);
    
    const googleResult = await fetchGooglePlaces(finalCity, decision.recommendation_type!, budget);

    if (googleResult && googleResult.recommendation) {
      console.log('[generate-recommendation] Got recommendation from Google Places');
      
      // Save recommendation to database
      try {
        await supabase.from('recommendations').insert({
          user_id: user.id,
          group_id: group_id,
          name: googleResult.recommendation.name,
          name_ar: googleResult.recommendation.name_ar,
          recommendation_type: decision.recommendation_type,
          category: googleResult.recommendation.category,
          estimated_price: googleResult.recommendation.estimated_price,
          currency: 'SAR',
          price_range: googleResult.recommendation.price_range,
          rating: googleResult.recommendation.rating,
          is_partner: false,
          source: 'google_places',
          relevance_reason: googleResult.recommendation.relevance_reason,
          relevance_reason_ar: googleResult.recommendation.relevance_reason_ar,
          external_id: googleResult.recommendation.id,
          location: googleResult.recommendation.location,
          context: { trigger, group_type: groupType, city: finalCity }
        });

        // Increment user's daily count
        await supabase.rpc('increment_recommendation_count', { p_user_id: user.id });
      } catch (dbError) {
        console.error('[generate-recommendation] Error saving to database:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          decision: { ...decision, source: 'google_places' },
          recommendation: googleResult.recommendation,
          alternatives: googleResult.alternatives
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to static recommendations
    console.log('[generate-recommendation] Using fallback recommendations');
    
    const fallbackRecommendation = getFallbackRecommendation(finalCity, decision.recommendation_type!);
    
    if (fallbackRecommendation) {
      // Save fallback recommendation
      try {
        await supabase.from('recommendations').insert({
          user_id: user.id,
          group_id: group_id,
          name: fallbackRecommendation.name,
          name_ar: fallbackRecommendation.name_ar,
          recommendation_type: decision.recommendation_type,
          category: fallbackRecommendation.category,
          estimated_price: fallbackRecommendation.estimated_price,
          currency: 'SAR',
          price_range: fallbackRecommendation.price_range,
          rating: fallbackRecommendation.rating,
          is_partner: false,
          source: 'fallback',
          relevance_reason_ar: fallbackRecommendation.relevance_reason_ar,
          context: { trigger, group_type: groupType, city: finalCity }
        });

        await supabase.rpc('increment_recommendation_count', { p_user_id: user.id });
      } catch (dbError) {
        console.error('[generate-recommendation] Error saving fallback to database:', dbError);
      }

      return new Response(
        JSON.stringify({ 
          decision: { ...decision, source: 'fallback' },
          recommendation: fallbackRecommendation,
          alternatives: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No recommendation available
    return new Response(
      JSON.stringify({ 
        decision,
        error: 'لم نتمكن من إيجاد توصيات مناسبة',
        message: 'No recommendations available for this location'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-recommendation] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function makeRecommendationDecision(
  trigger: string, 
  currentTime?: string,
  groupType?: string
): RecommendationDecision {
  const now = currentTime ? new Date(currentTime) : new Date();
  const hour = now.getHours();

  switch (trigger) {
    case 'planning':
      if (groupType === 'travel') {
        return {
          should_recommend: true,
          recommendation_type: 'hotel',
          reason: 'group_planning_travel',
          priority: 2,
          source: 'travelpayouts'
        };
      }
      return {
        should_recommend: true,
        recommendation_type: 'food',
        reason: 'group_planning',
        priority: 1,
        source: 'google_places'
      };

    case 'meal_time':
      if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
        return {
          should_recommend: true,
          recommendation_type: 'food',
          reason: hour >= 19 ? 'dinner_time' : 'lunch_time',
          priority: 3,
          source: 'google_places'
        };
      }
      return {
        should_recommend: false,
        recommendation_type: null,
        reason: 'not_meal_time',
        priority: 0
      };

    case 'post_expense':
      return {
        should_recommend: true,
        recommendation_type: 'activity',
        reason: 'post_expense_suggestion',
        priority: 1,
        source: 'google_places'
      };

    case 'end_of_day':
      if (groupType === 'travel') {
        return {
          should_recommend: true,
          recommendation_type: 'hotel',
          reason: 'end_of_day_travel',
          priority: 2,
          source: 'travelpayouts'
        };
      }
      return {
        should_recommend: false,
        recommendation_type: null,
        reason: 'end_of_day_no_travel',
        priority: 0
      };

    default:
      return {
        should_recommend: false,
        recommendation_type: null,
        reason: 'unknown_trigger',
        priority: 0
      };
  }
}
