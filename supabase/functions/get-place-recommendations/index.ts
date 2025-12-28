import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceRecommendationRequest {
  city: string;
  group_type?: string;
  member_count?: number;
  context_type: 'planning' | 'during' | 'post';
  budget?: 'low' | 'medium' | 'high';
  recommendation_type: 'food' | 'accommodation' | 'activity';
  group_id?: string;
}

interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  types?: string[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  primaryTypeDisplayName?: { text: string };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!googleApiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API not configured', places: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

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

    const requestBody: PlaceRecommendationRequest = await req.json();
    const { city, group_type, member_count = 4, context_type, budget = 'medium', recommendation_type, group_id } = requestBody;

    console.log(`Getting ${recommendation_type} recommendations for ${city}, group type: ${group_type}, members: ${member_count}`);

    // Check user's recommendation limit
    const { data: limitCheck } = await supabase.rpc('check_recommendation_limit', { p_user_id: user.id });
    
    if (limitCheck === false) {
      console.log('User has reached daily recommendation limit');
      return new Response(
        JSON.stringify({ 
          error: 'daily_limit_reached',
          message: 'لقد وصلت للحد اليومي من التوصيات',
          places: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check cache first
    const cacheKey = `${city}_${recommendation_type}_${budget}`.toLowerCase();
    const { data: cachedData } = await supabase
      .from('places_cache')
      .select('data')
      .eq('city', city.toLowerCase())
      .eq('category', recommendation_type)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (cachedData?.data) {
      console.log('Returning cached places data');
      return new Response(
        JSON.stringify({ places: cachedData.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query based on recommendation type
    let textQuery = '';
    let includedTypes: string[] = [];

    switch (recommendation_type) {
      case 'food':
        textQuery = `restaurants for groups in ${city}`;
        includedTypes = ['restaurant', 'cafe', 'bakery', 'meal_takeaway'];
        break;
      case 'accommodation':
        textQuery = `hotels for groups in ${city}`;
        includedTypes = ['lodging', 'hotel'];
        break;
      case 'activity':
        textQuery = `activities for groups in ${city}`;
        includedTypes = ['tourist_attraction', 'amusement_park', 'museum', 'park'];
        break;
    }

    // Map budget to price levels
    const priceLevelMap: Record<string, string[]> = {
      low: ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_FREE'],
      medium: ['PRICE_LEVEL_MODERATE'],
      high: ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE']
    };

    // Call Google Places API (Text Search)
    const placesUrl = 'https://places.googleapis.com/v1/places:searchText';
    
    const placesResponse = await fetch(placesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.regularOpeningHours,places.location,places.primaryTypeDisplayName'
      },
      body: JSON.stringify({
        textQuery,
        includedType: includedTypes[0],
        languageCode: 'ar',
        maxResultCount: 10,
        rankPreference: 'RELEVANCE'
      })
    });

    if (!placesResponse.ok) {
      const errorText = await placesResponse.text();
      console.error('Google Places API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch places', details: errorText, places: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const placesData = await placesResponse.json();
    const places: GooglePlace[] = placesData.places || [];

    console.log(`Found ${places.length} places from Google`);

    // Filter and score places
    const scoredPlaces = places
      .filter(place => place.rating && place.rating >= 3.5)
      .map(place => {
        let score = place.rating || 0;
        
        // Bonus for being open
        if (place.regularOpeningHours?.openNow) {
          score += 0.5;
        }

        // Adjust score based on budget match
        const priceLevel = place.priceLevel;
        if (priceLevel && priceLevelMap[budget]?.includes(priceLevel)) {
          score += 1;
        }

        return {
          place_id: place.id,
          name: place.displayName?.text || 'مكان غير معروف',
          address: place.formattedAddress,
          rating: place.rating,
          price_level: priceLevel,
          types: place.types,
          is_open: place.regularOpeningHours?.openNow,
          location: place.location,
          category: place.primaryTypeDisplayName?.text,
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Cache the results
    if (scoredPlaces.length > 0) {
      const cacheEntry = {
        place_id: `cache_${city}_${recommendation_type}_${Date.now()}`,
        data: scoredPlaces,
        city: city.toLowerCase(),
        category: recommendation_type,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      await supabase.from('places_cache').upsert(cacheEntry, { onConflict: 'place_id' });
    }

    // Select the best recommendation
    const bestPlace = scoredPlaces[0];

    if (bestPlace) {
      // Generate relevance reason
      let relevanceReason = '';
      let relevanceReasonAr = '';

      if (member_count >= 5) {
        relevanceReasonAr = `مناسب للمجموعات الكبيرة (${member_count} أشخاص)`;
        relevanceReason = `Suitable for large groups (${member_count} people)`;
      } else {
        relevanceReasonAr = `مناسب لمجموعتكم`;
        relevanceReason = `Suitable for your group`;
      }

      if (bestPlace.rating && bestPlace.rating >= 4.5) {
        relevanceReasonAr += ` • تقييم ممتاز`;
        relevanceReason += ` • Excellent rating`;
      }

      if (bestPlace.is_open) {
        relevanceReasonAr += ` • مفتوح الآن`;
        relevanceReason += ` • Open now`;
      }

      // Store recommendation
      const { data: recommendation, error: insertError } = await supabase
        .from('recommendations')
        .insert({
          user_id: user.id,
          group_id,
          recommendation_type,
          source: 'google_places',
          place_id: bestPlace.place_id,
          name: bestPlace.name,
          name_ar: bestPlace.name,
          category: bestPlace.category,
          rating: bestPlace.rating,
          price_range: budget,
          location: {
            city,
            address: bestPlace.address,
            lat: bestPlace.location?.latitude,
            lng: bestPlace.location?.longitude
          },
          relevance_reason: relevanceReason,
          relevance_reason_ar: relevanceReasonAr,
          is_partner: false,
          status: 'pending',
          context: {
            trigger: context_type,
            group_type,
            member_count,
            budget
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing recommendation:', insertError);
      } else {
        // Increment user's daily count
        await supabase.rpc('increment_recommendation_count', { p_user_id: user.id });
      }

      return new Response(
        JSON.stringify({
          recommendation: recommendation || {
            ...bestPlace,
            relevance_reason: relevanceReason,
            relevance_reason_ar: relevanceReasonAr
          },
          alternatives: scoredPlaces.slice(1),
          cached: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        recommendation: null, 
        alternatives: [], 
        message: 'No suitable places found' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-place-recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message, places: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
