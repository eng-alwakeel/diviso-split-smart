import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  group_id?: string;
  city?: string;
  trigger: 'planning' | 'meal_time' | 'post_expense' | 'end_of_day';
  current_time?: string;
  group_type?: string;
  member_count?: number;
}

interface RecommendationDecision {
  should_recommend: boolean;
  recommendation_type: 'food' | 'accommodation' | 'activity' | null;
  reason: string;
  priority: number;
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
    const { group_id, city, trigger, current_time, group_type, member_count = 4 } = requestBody;

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

    // If we have a city, fetch actual recommendation
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
          decision,
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
        message: 'City required to fetch actual recommendation'
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
          recommendation_type: 'accommodation',
          reason: 'group_planning_travel',
          priority: 2
        };
      }
      return {
        should_recommend: true,
        recommendation_type: 'food',
        reason: 'group_planning',
        priority: 1
      };

    case 'meal_time':
      // Lunch (12-2pm) or Dinner (7-9pm)
      if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
        return {
          should_recommend: true,
          recommendation_type: 'food',
          reason: hour >= 19 ? 'dinner_time' : 'lunch_time',
          priority: 3
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
        priority: 1
      };

    case 'end_of_day':
      // End of day, suggest accommodation if travel group
      if (groupType === 'travel') {
        return {
          should_recommend: true,
          recommendation_type: 'accommodation',
          reason: 'end_of_day_travel',
          priority: 2
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
