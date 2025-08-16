import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const exchangeRateApiKey = Deno.env.get('EXCHANGE_RATE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
  success: boolean;
  timestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting exchange rate update...');

    // Get list of active currencies
    const { data: currencies, error: currenciesError } = await supabase
      .from('currencies')
      .select('code')
      .eq('is_active', true);

    if (currenciesError) {
      throw new Error(`Failed to fetch currencies: ${currenciesError.message}`);
    }

    const currencyCodes = currencies.map(c => c.code);
    console.log(`Found ${currencyCodes.length} active currencies:`, currencyCodes);

    // Fetch exchange rates for each base currency
    const exchangeRates: Array<{
      from_currency: string;
      to_currency: string;
      rate: number;
      date: string;
    }> = [];

    for (const baseCurrency of currencyCodes) {
      try {
        console.log(`Fetching rates for base currency: ${baseCurrency}`);
        
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${baseCurrency}?access_key=${exchangeRateApiKey}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch rates for ${baseCurrency}: ${response.statusText}`);
          continue;
        }

        const data: ExchangeRateResponse = await response.json();
        
        if (!data.success && data.rates) {
          console.error(`API returned error for ${baseCurrency}:`, data);
          continue;
        }

        const rates = data.rates || {};
        
        // Add rates for this base currency
        for (const targetCurrency of currencyCodes) {
          if (baseCurrency !== targetCurrency && rates[targetCurrency]) {
            exchangeRates.push({
              from_currency: baseCurrency,
              to_currency: targetCurrency,
              rate: rates[targetCurrency],
              date: new Date().toISOString().split('T')[0]
            });
          }
        }

        // Add rate for same currency (1.0)
        exchangeRates.push({
          from_currency: baseCurrency,
          to_currency: baseCurrency,
          rate: 1.0,
          date: new Date().toISOString().split('T')[0]
        });

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching rates for ${baseCurrency}:`, error);
        continue;
      }
    }

    console.log(`Prepared ${exchangeRates.length} exchange rate records`);

    if (exchangeRates.length === 0) {
      throw new Error('No exchange rates were fetched successfully');
    }

    // Insert or update exchange rates in batches
    const batchSize = 100;
    let successCount = 0;
    
    for (let i = 0; i < exchangeRates.length; i += batchSize) {
      const batch = exchangeRates.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('exchange_rates')
        .upsert(batch, {
          onConflict: 'from_currency,to_currency,date'
        });

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        successCount += batch.length;
        console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} records)`);
      }
    }

    // Clean up old exchange rates (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error: deleteError } = await supabase
      .from('exchange_rates')
      .delete()
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (deleteError) {
      console.error('Error cleaning up old rates:', deleteError);
    } else {
      console.log('Successfully cleaned up old exchange rates');
    }

    console.log(`Exchange rate update completed. ${successCount} rates updated.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${successCount} exchange rates`,
        currencies: currencyCodes.length,
        rates_updated: successCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in update-exchange-rates function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
