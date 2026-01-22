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
    // Amount is now TAX-INCLUSIVE (what the user actually pays)
    const amountInclVat = body.amount || 21.85; // Default: 19 SAR + 15% VAT = 21.85 SAR
    const draftOnly = body.draft_only !== false; // Default to true for testing
    const sendEmail = body.send_email === true; // Default to false

    console.log('Test parameters:', { testUserId, purchaseType, amountInclVat, draftOnly, sendEmail });

    // Step 1: Get or create test data
    let userId = testUserId;
    let userEmail = 'test@example.com';
    let userName = 'Test User';
    let userPhone = '+966500000000'; // Default to Saudi number

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
        console.log('Using real user:', { userId, userEmail, userName, userPhone });
      }

      // Get auth email
      const { data: authUser } = await supabase.auth.admin.getUserById(testUserId);
      if (authUser?.user?.email) {
        userEmail = authUser.user.email;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Please provide a valid user_id in the request body',
          example: {
            user_id: 'your-uuid-here',
            purchase_type: 'subscription_monthly',
            amount: 21.85, // TAX-INCLUSIVE amount
            draft_only: true,
            send_email: false
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine if Saudi user (affects VAT calculation)
    const isSaudi = userPhone && (userPhone.startsWith('+966') || userPhone.startsWith('00966'));
    
    // Calculate amounts based on tax-inclusive input
    let subtotal: number;
    let vatRate: number;
    let vatAmount: number;
    let totalAmount: number;

    if (isSaudi) {
      // Saudi: Extract subtotal from tax-inclusive price (15% VAT included)
      vatRate = 0.15;
      totalAmount = amountInclVat;
      subtotal = amountInclVat / (1 + vatRate);
      vatAmount = totalAmount - subtotal;
    } else {
      // Non-Saudi: No VAT, full amount is service fee
      vatRate = 0;
      subtotal = amountInclVat;
      vatAmount = 0;
      totalAmount = amountInclVat;
    }

    console.log('Amount calculation:', { 
      isSaudi, 
      inputAmount: amountInclVat,
      subtotal: subtotal.toFixed(2), 
      vatRate,
      vatAmount: vatAmount.toFixed(2), 
      totalAmount: totalAmount.toFixed(2) 
    });

    // Step 2: Create a test invoice record in our database
    const invoiceNumber = `TEST-INV-${Date.now()}`;

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
        seller_vat_number: isSaudi ? '300000000000003' : null,
        seller_address: 'Riyadh, Saudi Arabia',
        total_excl_vat: parseFloat(subtotal.toFixed(2)),
        vat_rate: vatRate,
        total_vat: parseFloat(vatAmount.toFixed(2)),
        total_incl_vat: parseFloat(totalAmount.toFixed(2)),
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

    const itemNameAr = purchaseType === 'subscription_monthly' ? 'اشتراك شهري برو' :
                       purchaseType === 'subscription_annual' ? 'اشتراك سنوي برو' :
                       'رصيد ديفيزو';

    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: invoice.id,
        item_type: purchaseType,
        description: itemName,
        description_ar: itemNameAr,
        quantity: 1,
        unit_price_excl_vat: parseFloat(subtotal.toFixed(2)),
        vat_rate: vatRate,
        vat_amount: parseFloat(vatAmount.toFixed(2)),
        line_total_incl_vat: parseFloat(totalAmount.toFixed(2)),
      });

    if (itemError) {
      console.error('Failed to create invoice item:', itemError);
    }

    // Step 4: Call the Odoo invoice creation function
    console.log('Calling odoo-create-invoice with draft_only:', draftOnly);

    const odooResponse = await fetch(`${supabaseUrl}/functions/v1/odoo-create-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        purchase_type: purchaseType,
        amount: amountInclVat, // Pass tax-inclusive amount
        credit_purchase_id: invoice.id,
        draft_only: draftOnly,
      }),
    });

    const odooResult = await odooResponse.json();
    console.log('Odoo response:', odooResult);

    // Step 5: Optionally send invoice email
    let emailResult = null;
    if (sendEmail && userEmail) {
      console.log('Sending invoice email...');
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      emailResult = await emailResponse.json();
      console.log('Email response:', emailResult);
    }

    // Step 6: Fetch the updated invoice with QR data
    const { data: updatedInvoice } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test invoice cycle completed',
        is_saudi: isSaudi,
        vat_applied: isSaudi,
        calculation: {
          input_amount: amountInclVat,
          subtotal: parseFloat(subtotal.toFixed(2)),
          vat_rate: vatRate,
          vat_amount: parseFloat(vatAmount.toFixed(2)),
          total: parseFloat(totalAmount.toFixed(2)),
        },
        test_invoice: updatedInvoice,
        odoo_result: odooResult,
        email_result: emailResult,
        next_steps: [
          'Check the invoice in your Odoo dashboard',
          isSaudi ? 'Verify the QR code was generated' : 'No QR code (non-Saudi user)',
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
