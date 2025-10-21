import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-revenuecat-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing REVENUECAT_WEBHOOK_SECRET" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Secure constant-time signature verification to prevent timing attacks
    const sig = req.headers.get("x-revenuecat-signature") || req.headers.get("authorization") || "";
    
    if (!sig) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use constant-time comparison to prevent timing attacks
    const encoder = new TextEncoder();
    const expectedBytes = encoder.encode(secret);
    const receivedBytes = encoder.encode(sig);
    
    // Check length first (not vulnerable to timing attacks)
    if (expectedBytes.length !== receivedBytes.length) {
      console.warn("Webhook auth failed: length mismatch");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Constant-time comparison
    let isValid = true;
    for (let i = 0; i < expectedBytes.length; i++) {
      if (expectedBytes[i] !== receivedBytes[i]) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      console.warn("Webhook auth failed: invalid signature");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => ({}));

    // Extract core fields in a defensive way (RevenueCat payloads can vary)
    const appUserId: string | null = (
      body.app_user_id ||
      body?.event?.app_user_id ||
      body?.subscriber?.app_user_id ||
      body?.data?.app_user_id ||
      null
    );

    // Determine product identifier (SKU)
    const productId: string | null = (
      body?.product?.identifier ||
      body?.event?.product_id ||
      body?.data?.product_id ||
      null
    );

    const type: string = (body?.event?.type || body?.type || "").toString().toUpperCase();

    // Timestamps
    const startedAtRaw = body?.event?.purchased_at_ms || body?.transaction?.purchased_at_ms || body?.purchased_at_ms;
    const expiresAtRaw = body?.event?.expiration_at_ms || body?.expiration_at_ms || body?.subscriber?.subscriptions?.[productId || ""]?.expires_date_ms;
    const canceledAtRaw = body?.event?.cancellation_at_ms || body?.cancellation_at_ms;

    const toIso = (ms: any | null | undefined) => {
      const n = Number(ms);
      if (!n || isNaN(n)) return null;
      return new Date(n).toISOString();
    };

    const started_at = toIso(startedAtRaw) || new Date().toISOString();
    const expires_at = toIso(expiresAtRaw) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const canceled_at = toIso(canceledAtRaw);

    // Map productId to our plan enum used in DB: 'personal' | 'family'
    const mapProductToPlan = (pid?: string | null): "personal" | "family" | null => {
      const p = (pid || "").toLowerCase();
      if (!p) return null;
      if (p.includes("family")) return "family";
      // Known SKUs from the spec
      if ([
        "pro_month_19sar",
        "pro_year_169sar",
      ].includes(p)) return "personal";
      if ([
        "family5_month_39sar",
        "family5_year_349sar",
      ].includes(p)) return "family";
      // Fallback by name
      if (p.includes("pro")) return "personal";
      return "personal";
    };

    const plan = mapProductToPlan(productId);

    // Map RevenueCat event type to our status enum: 'trialing' | 'active' | 'expired' | 'canceled'
    const mapTypeToStatus = (t: string): "trialing" | "active" | "expired" | "canceled" => {
      if (t.includes("TRIAL")) return "trialing";
      if (t.includes("INITIAL_PURCHASE") || t.includes("RENEWAL") || t.includes("PURCHASE")) return "active";
      if (t.includes("CANCELLATION")) return "canceled";
      if (t.includes("EXPIRATION") || t.includes("EXPIRE")) return "expired";
      if (t.includes("BILLING_ISSUE")) return "active"; // keep access until expiration
      return "active";
    };

    const status = mapTypeToStatus(type);

    if (!appUserId || !plan) {
      return new Response(JSON.stringify({ error: "Missing app_user_id or plan mapping", received: { appUserId, productId, type } }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRole);

    // Upsert into user_subscriptions
    const { error: upsertErr } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: appUserId,
          plan,
          status,
          started_at,
          expires_at,
          canceled_at,
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("RevenueCat webhook upsert error:", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("RevenueCat webhook error:", e);
    return new Response(JSON.stringify({ error: "unexpected_error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
