import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== TEST ODOO INVOICE FLOW ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional overrides
    const body = await req.json().catch(() => ({}));
    const testUserId = body.user_id; // Optional: use a real user ID for testing
    const purchaseType = body.purchase_type || 'subscription_monthly'; // or 'subscription_annual', 'credits_pack'
    const amount = body.amount || 1900; // Amount in halalas (19 SAR)

    console.log('Test parameters:', { testUserId, purchaseType, amount });

    // Step 1: Get or create test data
    let userId = testUserId;
    let userEmail = 'test@example.com';
    let userName = 'Test User';
    let userPhone = '+966500000000';

    if (testUserId) {
      // Fetch real user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, name, phone')
        .eq('id', testUserId)
        .single();

      if (profile) {
        userId = profile.id;
        userEmail = profile.email || userEmail;
        userName = profile.name || userName;
        userPhone = profile.phone || userPhone;
        console.log('Using real user:', { userId, userEmail, userName });
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Please provide a valid user_id in the request body',
          example: {
            user_id: 'your-uuid-here',
            purchase_type: 'subscription_monthly',
            amount: 1900
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create a test invoice record in our database
    const invoiceNumber = `TEST-INV-${Date.now()}`;
    const subtotal = amount / 100;
    const vatRate = 0.15;
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    console.log('Creating test invoice:', { invoiceNumber, subtotal, vatAmount, totalAmount });

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: userId,
        buyer_name: userName,
        buyer_email: userEmail,
        buyer_phone: userPhone,
        seller_legal_name: 'Diviso',
        seller_vat_number: '300000000000003',
        seller_address: 'Riyadh, Saudi Arabia',
        total_excl_vat: subtotal,
        vat_rate: vatRate,
        total_vat: vatAmount,
        total_incl_vat: totalAmount,
        payment_status: 'paid',
        payment_provider: 'test',
        currency: 'SAR',
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Failed to create test invoice:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Failed to create test invoice', details: invoiceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Test invoice created:', invoice.id);

    // Step 3: Add invoice item
    const itemName = purchaseType === 'subscription_monthly' ? 'Pro Monthly Subscription' :
                     purchaseType === 'subscription_annual' ? 'Pro Annual Subscription' :
                     'Credits Pack';

    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        item_type: purchaseType,
        description: itemName,
        quantity: 1,
        unit_price: subtotal,
        total_price: subtotal,
      });

    if (itemError) {
      console.error('Failed to create invoice item:', itemError);
    }

    // Step 4: Call the Odoo invoice creation function
    console.log('Calling odoo-create-invoice...');

    const odooResponse = await fetch(`${supabaseUrl}/functions/v1/odoo-create-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        invoice_id: invoice.id,
        user_id: userId,
        purchase_type: purchaseType,
        amount: amount,
        user_email: userEmail,
        user_name: userName,
        user_phone: userPhone,
      }),
    });

    const odooResult = await odooResponse.json();
    console.log('Odoo response:', odooResult);

    // Step 5: Fetch the updated invoice with QR data
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test invoice cycle completed',
        test_invoice: updatedInvoice,
        odoo_result: odooResult,
        next_steps: [
          'Check the invoice in your Odoo dashboard',
          'Verify the QR code was generated',
          'The invoice should appear in the user\'s invoice history'
        ]
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test flow error:', error);
    return new Response(
      JSON.stringify({ error: 'Test flow failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
