import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-revenuecat-signature",
};

// Rate limiting to prevent abuse
const FAILED_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60000; // 1 minute

function checkRateLimit(clientIp: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = FAILED_ATTEMPTS.get(clientIp);
  
  // Clean up expired entries
  if (attempts && now >= attempts.resetAt) {
    FAILED_ATTEMPTS.delete(clientIp);
    return { allowed: true };
  }
  
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((attempts.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(clientIp: string): void {
  const now = Date.now();
  const attempts = FAILED_ATTEMPTS.get(clientIp);
  
  if (!attempts || now >= attempts.resetAt) {
    FAILED_ATTEMPTS.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    attempts.count++;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: "Too many failed attempts", 
        retry_after: rateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          "Content-Type": "application/json", 
          "Retry-After": String(rateCheck.retryAfter),
          ...corsHeaders 
        },
      });
    }

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
      recordFailedAttempt(clientIp);
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
      recordFailedAttempt(clientIp);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Clear any failed attempts on successful auth
    FAILED_ATTEMPTS.delete(clientIp);

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

    // Determine billing cycle from product ID
    const billingCycle = (productId || "").toLowerCase().includes("year") ? "yearly" : "monthly";

    // Calculate next renewal date
    const calculateNextRenewal = (expiresAt: string, cycle: string): string => {
      const expDate = new Date(expiresAt);
      if (cycle === "yearly") {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate.setMonth(expDate.getMonth() + 1);
      }
      return expDate.toISOString();
    };

    // Handle grace period for billing issues (3 days)
    const GRACE_PERIOD_DAYS = 3;
    let gracePeriodEndsAt: string | null = null;
    let lastPaymentStatus = "succeeded";
    let lastPaymentFailedAt: string | null = null;

    if (type.includes("BILLING_ISSUE")) {
      gracePeriodEndsAt = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
      lastPaymentStatus = "failed";
      lastPaymentFailedAt = new Date().toISOString();
      console.log(`Billing issue detected for user ${appUserId}, grace period until ${gracePeriodEndsAt}`);
    }

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

    // Build update object
    const subscriptionData: Record<string, any> = {
      user_id: appUserId,
      plan,
      status,
      started_at,
      expires_at,
      canceled_at,
      billing_cycle: billingCycle,
      auto_renew: true, // Default to true for new subscriptions
    };

    // Set next renewal date for active/renewed subscriptions
    if (type.includes("INITIAL_PURCHASE") || type.includes("RENEWAL")) {
      subscriptionData.next_renewal_date = calculateNextRenewal(expires_at, billingCycle);
      subscriptionData.last_payment_status = "succeeded";
      subscriptionData.grace_period_ends_at = null;
      subscriptionData.last_payment_failed_at = null;
      subscriptionData.renewal_reminder_sent_at = null;
      console.log(`Subscription ${type} for user ${appUserId}, next renewal: ${subscriptionData.next_renewal_date}`);
    }

    // Handle billing issue - set grace period
    if (type.includes("BILLING_ISSUE")) {
      subscriptionData.grace_period_ends_at = gracePeriodEndsAt;
      subscriptionData.last_payment_status = lastPaymentStatus;
      subscriptionData.last_payment_failed_at = lastPaymentFailedAt;
      
      // Create notification for the user about billing issue
      await supabase.from("notifications").insert({
        user_id: appUserId,
        type: "billing_issue",
        payload: {
          title_ar: "مشكلة في الدفع",
          title_en: "Billing Issue",
          message_ar: `يرجى تحديث طريقة الدفع خلال ${GRACE_PERIOD_DAYS} أيام للحفاظ على اشتراكك.`,
          message_en: `Please update your payment method within ${GRACE_PERIOD_DAYS} days to keep your subscription.`,
          grace_period_ends_at: gracePeriodEndsAt,
        },
      });
    }

    // Handle expiration - stop granting credits
    if (type.includes("EXPIRATION") || type.includes("EXPIRE")) {
      subscriptionData.auto_renew = false;
      subscriptionData.next_renewal_date = null;
      console.log(`Subscription expired for user ${appUserId}`);
    }

    // Upsert into user_subscriptions
    const { error: upsertErr } = await supabase
      .from("user_subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("RevenueCat webhook upsert error:", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Successfully processed ${type} event for user ${appUserId}`);

    return new Response(JSON.stringify({ ok: true, event_type: type }), {
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
