import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter: userId -> { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "rate_limited", message: "Too many requests" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { group_id, phone_raw } = await req.json();

    if (!group_id || !phone_raw) {
      return new Response(
        JSON.stringify({ error: "Missing group_id or phone_raw" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate caller is a member of the group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", userId)
      .in("status", ["active", "admin", "owner"])
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "Not a member of this group" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize phone: keep only digits and leading +
    const cleaned = phone_raw.replace(/[^\\d+]/g, "");

    // Use service role client for cross-user profile lookup
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Search profiles by phone
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("phone", cleaned)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already a member of this group
    const { data: existingMember } = await serviceClient
      .from("group_members")
      .select("status")
      .eq("group_id", group_id)
      .eq("user_id", profile.id)
      .maybeSingle();

    const alreadyMember = !!existingMember;
    const memberStatus = existingMember?.status || null;

    return new Response(
      JSON.stringify({
        found: true,
        user: {
          id: profile.id,
          display_name: profile.name || "مستخدم Diviso",
          avatar_url: profile.avatar_url || null,
        },
        already_member: alreadyMember,
        member_status: memberStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("lookup-user-by-phone error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
