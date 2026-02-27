import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Normalize a raw phone string to E.164 (+966…) */
function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00966")) cleaned = "+" + cleaned.slice(2);
  else if (cleaned.startsWith("0")) cleaned = "+966" + cleaned.slice(1);
  else if (cleaned.startsWith("966") && !cleaned.startsWith("+")) cleaned = "+" + cleaned;
  else if (!cleaned.startsWith("+")) cleaned = "+966" + cleaned;
  return cleaned;
}

function isValidE164(phone: string): boolean {
  return /^\+\d{8,15}$/.test(phone);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, reason: "unauthorized" }, 401);
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ ok: false, reason: "unauthorized" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    // ── Input ──
    const { group_id, phone_raw, invitee_name } = await req.json();
    if (!group_id || !phone_raw) {
      return json({ ok: false, reason: "missing_fields" }, 400);
    }

    const phoneE164 = normalizePhone(phone_raw);
    if (!isValidE164(phoneE164)) {
      return json({ ok: false, reason: "INVALID_PHONE" }, 400);
    }

    // ── Service client ──
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Verify caller is admin/owner ──
    const { data: membership } = await svc
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", callerId)
      .eq("status", "active")
      .is("archived_at", null)
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return json({ ok: false, reason: "not_admin" }, 403);
    }

    // ── Check existing group_members by phone ──
    const { data: existingMember } = await svc
      .from("group_members")
      .select("id, status, user_id, phone_e164")
      .eq("group_id", group_id)
      .eq("phone_e164", phoneE164)
      .is("archived_at", null)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === "active") {
        return json({ ok: false, reason: "already_active_member" });
      }

      // Idempotent: invited or pending — find/create token and return
      const inviteUrl = await getOrCreateInviteUrl(svc, group_id);
      return json({
        ok: true,
        idempotent: true,
        member_id: existingMember.id,
        member_status: existingMember.status,
        invite_url: inviteUrl,
        is_registered: !!existingMember.user_id,
        message: "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي.",
      });
    }

    // ── Also check by user_id if phone belongs to registered user ──
    const { data: profile } = await svc
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("phone", phoneE164)
      .maybeSingle();

    // Check if registered user is already a member by user_id
    if (profile) {
      const { data: memberByUserId } = await svc
        .from("group_members")
        .select("id, status")
        .eq("group_id", group_id)
        .eq("user_id", profile.id)
        .is("archived_at", null)
        .maybeSingle();

      if (memberByUserId) {
        if (memberByUserId.status === "active") {
          return json({ ok: false, reason: "already_active_member" });
        }
        const inviteUrl = await getOrCreateInviteUrl(svc, group_id);
        return json({
          ok: true,
          idempotent: true,
          member_id: memberByUserId.id,
          member_status: memberByUserId.status,
          invite_url: inviteUrl,
          is_registered: true,
          message: "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي.",
        });
      }
    }

    // ── Create new member ──
    const isRegistered = !!profile;
    let memberId: string;
    let memberStatus: string;

    if (isRegistered && profile) {
      // Registered user → status='invited', user_id set
      memberStatus = "invited";
      const { data: newMember, error: memberErr } = await svc
        .from("group_members")
        .insert({
          group_id,
          user_id: profile.id,
          phone_e164: phoneE164,
          display_name: profile.name || invitee_name || "عضو",
          role: "member",
          status: "invited",
        })
        .select("id")
        .single();

      if (memberErr) {
        console.error("group_members insert error (registered):", memberErr);
        return json({ ok: false, reason: "db_error", detail: memberErr.message }, 500);
      }
      memberId = newMember.id;
    } else {
      // Unregistered user → status='pending', require name
      if (!invitee_name?.trim()) {
        return json({ ok: false, reason: "NAME_REQUIRED" }, 400);
      }
      memberStatus = "pending";
      const { data: newMember, error: memberErr } = await svc
        .from("group_members")
        .insert({
          group_id,
          user_id: null,
          phone_e164: phoneE164,
          display_name: invitee_name.trim(),
          role: "member",
          status: "pending",
        })
        .select("id")
        .single();

      if (memberErr) {
        console.error("group_members insert error (unregistered):", memberErr);
        return json({ ok: false, reason: "db_error", detail: memberErr.message }, 500);
      }
      memberId = newMember.id;
    }

    // ── Insert into invites table for tracking ──
    try {
      await svc.from("invites").insert({
        group_id,
        phone_or_email: phoneE164,
        invited_role: "member",
        created_by: callerId,
        status: "sent",
        invite_source: "phone_invite",
      });
    } catch (inviteErr) {
      // Non-blocking: invites table insert is for tracking only
      console.error("invites tracking insert error (non-blocking):", inviteErr);
    }

    // ── Create join token ──
    const inviteUrl = await getOrCreateInviteUrl(svc, group_id);

    return json({
      ok: true,
      member_id: memberId,
      member_status: memberStatus,
      invite_url: inviteUrl,
      is_registered: isRegistered,
    });
  } catch (err) {
    console.error("create-phone-invite error:", err);
    return json({ ok: false, reason: "internal_error" }, 500);
  }
});

/** Create or reuse an active group_join_token and return the invite URL */
async function getOrCreateInviteUrl(
  svc: ReturnType<typeof createClient>,
  groupId: string
): Promise<string | null> {
  // Check for existing active token
  const { data: existingToken } = await svc
    .from("group_join_tokens")
    .select("token, expires_at")
    .eq("group_id", groupId)
    .eq("link_type", "phone_invite")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingToken?.token) {
    return `https://diviso.app/i/${existingToken.token}`;
  }

  // Create new token
  try {
    const { data: tokenData, error: tokenErr } = await svc.rpc("create_group_join_token", {
      p_group_id: groupId,
      p_role: "member",
      p_link_type: "phone_invite",
    });

    if (tokenErr) {
      console.error("Token creation error:", tokenErr);
      return null;
    }

    const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
    const tk =
      typeof tokenObj === "object" && tokenObj !== null
        ? (tokenObj as { token?: string }).token
        : String(tokenObj);
    return tk ? `https://diviso.app/i/${tk}` : null;
  } catch (err) {
    console.error("Token creation exception:", err);
    return null;
  }
}
