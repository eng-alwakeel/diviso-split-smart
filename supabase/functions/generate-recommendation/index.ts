import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  group_id?: string;
  city?: string;
  destination?: string; // For Travelpayouts (city code or IATA)
  trigger: 'planning' | 'meal_time' | 'post_expense' | 'end_of_day';
  current_time?: string;
  group_type?: string;
  member_count?: number;
  check_in?: string; // For hotel search
  check_out?: string;
}

interface RecommendationDecision {
  should_recommend: boolean;
  recommendation_type: 'food' | 'accommodation' | 'activity' | 'hotel' | 'flight' | 'car_rental' | null;
  reason: string;
  priority: number;
  source?: 'google_places' | 'travelpayouts';
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

// Travelpayouts API helper
async function fetchTravelpayoutsHotels(
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2
): Promise<TravelpayoutsHotel[]> {
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (!token) {
    console.log('TRAVELPAYOUTS_TOKEN not configured');
    return [];
  }

  try {
    // Use Travelpayouts Hotel Search API
    const url = `https://engine.hotellook.com/api/v2/cache.json?location=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&limit=10&token=${token}`;
    
    console.log(`Fetching Travelpayouts hotels for: ${destination}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Travelpayouts API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.log('No hotels found from Travelpayouts');
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
    console.error('Error fetching Travelpayouts hotels:', error);
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
    const { group_id, city, destination, trigger, current_time, group_type, member_count = 4 } = requestBody;

    console.log(`Generate recommendation for trigger: ${trigger}, group: ${group_id}`);

    // Check user's recommendation limit first
    const { data: canRecommend } = await supabase.rpc('check_recommendation_limit', { p_user_id: user.id });
    
    if (!canRecommend) {
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
    let groupInfo = null;
    let groupCity = city;
    let groupMemberCount = member_count;
    let groupType = group_type;

    if (group_id) {
      const { data: group } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .eq('id', group_id)
        .single();

      if (group) {
        groupInfo = group;
        groupType = group.group_type || 'general';
        
        // Get member count
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group_id);
        
        groupMemberCount = count || member_count;
      }
    }

    // Decision engine logic
    const decision = makeRecommendationDecision(trigger, current_time, groupType);

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
      console.log('Trying Travelpayouts for hotel recommendation...');
      
      const checkIn = requestBody.check_in || new Date().toISOString().split('T')[0];
      const checkOutDate = new Date();
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      const checkOut = requestBody.check_out || checkOutDate.toISOString().split('T')[0];
      
      const hotels = await fetchTravelpayoutsHotels(destination, checkIn, checkOut, groupMemberCount);
      
      if (hotels.length > 0) {
        console.log(`Found ${hotels.length} hotels from Travelpayouts`);
        
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

    // Fallback to Google Places for food/activity or if Travelpayouts has no results
    if (groupCity && decision.recommendation_type) {
      // Call get-place-recommendations function internally
      const { data: recommendation, error: recError } = await supabase.functions.invoke(
        'get-place-recommendations',
        {
          body: {
            city: groupCity,
            group_type: groupType,
            member_count: groupMemberCount,
            context_type: trigger === 'planning' ? 'planning' : 
                         trigger === 'meal_time' ? 'during' : 'post',
            budget,
            recommendation_type: decision.recommendation_type,
            group_id
          },
          headers: {
            Authorization: authHeader
          }
        }
      );

      if (recError) {
        console.error('Error fetching recommendation:', recError);
        return new Response(
          JSON.stringify({ decision, error: recError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          decision: { ...decision, source: 'google_places' },
          recommendation: recommendation?.recommendation,
          alternatives: recommendation?.alternatives
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return decision without actual recommendation (city not provided)
    return new Response(
      JSON.stringify({ 
        decision,
        message: 'City or destination required to fetch actual recommendation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-recommendation:', error);
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
      // During group planning, suggest based on group type
      if (groupType === 'travel') {
        return {
          should_recommend: true,
          recommendation_type: 'hotel', // Use hotel for Travelpayouts
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
      // Lunch (12-2pm) or Dinner (7-9pm)
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
      // After adding an expense, might suggest related activity
      return {
        should_recommend: true,
        recommendation_type: 'activity',
        reason: 'post_expense_suggestion',
        priority: 1,
        source: 'google_places'
      };

    case 'end_of_day':
      // End of day, suggest accommodation if travel group
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
