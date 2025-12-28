import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackEventRequest {
  recommendation_id: string;
  event_type: 'shown' | 'clicked' | 'dismissed' | 'expense_added' | 'affiliate_clicked';
  metadata?: Record<string, unknown>;
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

    const requestBody: TrackEventRequest = await req.json();
    const { recommendation_id, event_type, metadata = {} } = requestBody;

    if (!recommendation_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recommendation_id, event_type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Tracking event: ${event_type} for recommendation: ${recommendation_id}`);

    // Verify recommendation exists and belongs to user
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select('id, user_id, status')
      .eq('id', recommendation_id)
      .single();

    if (recError || !recommendation) {
      console.error('Recommendation not found:', recError);
      return new Response(
        JSON.stringify({ error: 'Recommendation not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Insert analytics event
    const { error: analyticsError } = await supabase
      .from('recommendation_analytics')
      .insert({
        recommendation_id,
        user_id: user.id,
        event_type,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
        }
      });

    if (analyticsError) {
      console.error('Error inserting analytics:', analyticsError);
      return new Response(
        JSON.stringify({ error: 'Failed to track event' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update recommendation status based on event
    let newStatus = recommendation.status;
    let updateData: Record<string, unknown> = {};

    switch (event_type) {
      case 'shown':
        updateData = { shown_at: new Date().toISOString() };
        break;
      case 'clicked':
        updateData = { interacted_at: new Date().toISOString() };
        if (recommendation.status === 'pending') {
          newStatus = 'accepted';
        }
        break;
      case 'dismissed':
        newStatus = 'dismissed';
        updateData = { interacted_at: new Date().toISOString() };
        break;
      case 'expense_added':
        newStatus = 'converted';
        updateData = { converted_at: new Date().toISOString() };
        break;
      case 'affiliate_clicked':
        updateData = { interacted_at: new Date().toISOString() };
        break;
    }

    // Update recommendation
    if (newStatus !== recommendation.status || Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('recommendations')
        .update({ status: newStatus, ...updateData })
        .eq('id', recommendation_id);

      if (updateError) {
        console.error('Error updating recommendation:', updateError);
      }
    }

    // Calculate KPIs for response
    const { data: stats } = await supabase
      .from('recommendation_analytics')
      .select('event_type')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const eventCounts = stats?.reduce((acc, { event_type }) => {
      acc[event_type] = (acc[event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const shown = eventCounts['shown'] || 0;
    const clicked = eventCounts['clicked'] || 0;
    const converted = eventCounts['expense_added'] || 0;

    const ctr = shown > 0 ? (clicked / shown * 100).toFixed(2) : 0;
    const conversionRate = clicked > 0 ? (converted / clicked * 100).toFixed(2) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        event_type,
        recommendation_status: newStatus,
        kpis: {
          ctr: `${ctr}%`,
          conversion_rate: `${conversionRate}%`,
          total_shown: shown,
          total_clicked: clicked,
          total_converted: converted
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-recommendation-event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
