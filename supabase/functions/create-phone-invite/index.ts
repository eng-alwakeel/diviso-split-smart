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

    // ── Service client for cross-user operations ──
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Verify caller is admin/owner of the group ──
    const { data: membership } = await svc
      .from("group_members")
      .select("role")
      .eq("group_id", group_id)
      .eq("user_id", callerId)
      .in("status", ["active"])
      .maybeSingle();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return json({ ok: false, reason: "not_admin" }, 403);
    }

    // ── Check existing invites for idempotency ──
    const { data: existingInvite } = await svc
      .from("invites")
      .select("id, status, invite_token")
      .eq("group_id", group_id)
      .eq("phone_or_email", phoneE164)
      .in("status", ["pending", "sent"])
      .maybeSingle();

    // Also check with raw phone (in case stored differently)
    let existingInviteResult = existingInvite;
    if (!existingInviteResult && phoneE164 !== phone_raw) {
      const { data: altInvite } = await svc
        .from("invites")
        .select("id, status, invite_token")
        .eq("group_id", group_id)
        .eq("phone_or_email", phone_raw)
        .in("status", ["pending", "sent"])
        .maybeSingle();
      existingInviteResult = altInvite;
    }

    // ── Lookup user by phone ──
    const { data: profile } = await svc
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("phone", phoneE164)
      .maybeSingle();

    const isRegistered = !!profile;

    // ── Check if already an active member ──
    if (profile) {
      const { data: existingMember } = await svc
        .from("group_members")
        .select("status")
        .eq("group_id", group_id)
        .eq("user_id", profile.id)
        .in("status", ["active", "invited"])
        .maybeSingle();

      if (existingMember?.status === "active") {
        return json({ ok: false, reason: "already_active_member" });
      }

      if (existingMember?.status === "invited") {
        // Find existing invite token
        const { data: existingToken } = await svc
          .from("group_join_tokens")
          .select("token, expires_at")
          .eq("group_id", group_id)
          .eq("link_type", "phone_invite")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const inviteUrl = existingToken?.token
          ? `https://diviso.app/i/${existingToken.token}`
          : null;

        return json({
          ok: true,
          idempotent: true,
          invite_url: inviteUrl,
          member_status: "invited",
          is_registered: true,
          message: "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي.",
        });
      }
    }

    // ── Idempotent: return existing pending invite ──
    if (existingInviteResult) {
      // Find or create token for existing invite
      const { data: existingToken } = await svc
        .from("group_join_tokens")
        .select("token, expires_at")
        .eq("group_id", group_id)
        .eq("link_type", "phone_invite")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let inviteUrl: string | null = null;
      if (existingToken?.token) {
        inviteUrl = `https://diviso.app/i/${existingToken.token}`;
      } else {
        // Create new token
        const { data: newTokenData } = await svc.rpc("create_group_join_token", {
          p_group_id: group_id,
          p_role: "member",
          p_link_type: "phone_invite",
        });
        const tokenObj = Array.isArray(newTokenData) ? newTokenData[0] : newTokenData;
        const tk = typeof tokenObj === "object" && tokenObj !== null
          ? (tokenObj as { token?: string }).token
          : String(tokenObj);
        if (tk) inviteUrl = `https://diviso.app/i/${tk}`;
      }

      return json({
        ok: true,
        idempotent: true,
        invite_id: existingInviteResult.id,
        invite_url: inviteUrl,
        member_status: existingInviteResult.status,
        is_registered: isRegistered,
        message: "هذا الرقم موجود بالفعل — تم عرض رابط الدعوة الحالي.",
      });
    }

    // ── Create invite record ──
    let inviteId: string | null = null;
    let memberStatus: string;
    let warning: string | null = null;

    if (isRegistered && profile) {
      // Registered user → use group_invites table + send_group_invite RPC
      memberStatus = "invited";

      try {
        const { data: rpcResult, error: rpcErr } = await svc.rpc("send_group_invite", {
          p_group_id: group_id,
          p_invited_user_id: profile.id,
        });
        if (rpcErr) {
          console.error("send_group_invite RPC error:", rpcErr);
          // Fallback: manually insert into group_invites
          const { data: manualInvite, error: manualErr } = await svc
            .from("group_invites")
            .insert({
              group_id: group_id,
              invited_user_id: profile.id,
              invited_by_user_id: callerId,
              status: "pending",
            })
            .select("id")
            .single();

          if (manualErr) {
            console.error("Manual group_invites insert error:", manualErr);
            return json({ ok: false, reason: "db_error", detail: manualErr.message }, 500);
          }
          inviteId = manualInvite?.id || null;
          warning = "NOTIFY_FAILED";
        }
      } catch (err) {
        console.error("send_group_invite exception:", err);
        warning = "NOTIFY_FAILED";
      }
    } else {
      // Unregistered user → use invites table
      memberStatus = "pending";

      const { data: inviteData, error: inviteErr } = await svc
        .from("invites")
        .insert({
          group_id: group_id,
          phone_or_email: phoneE164,
          invited_role: "member",
          created_by: callerId,
          status: "sent",
          invite_source: "phone_invite",
        })
        .select("id")
        .single();

      if (inviteErr) {
        console.error("Invite insert error:", inviteErr);
        return json({ ok: false, reason: "db_error", detail: inviteErr.message }, 500);
      }
      inviteId = inviteData?.id || null;
    }

    // ── Create join token ──
    let inviteUrl: string | null = null;
    try {
      const { data: tokenData, error: tokenErr } = await svc.rpc("create_group_join_token", {
        p_group_id: group_id,
        p_role: "member",
        p_link_type: "phone_invite",
      });

      if (tokenErr) {
        console.error("Token creation error:", tokenErr);
      } else {
        const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
        const tk = typeof tokenObj === "object" && tokenObj !== null
          ? (tokenObj as { token?: string }).token
          : String(tokenObj);
        if (tk) inviteUrl = `https://diviso.app/i/${tk}`;
      }
    } catch (err) {
      console.error("Token creation exception:", err);
    }

    // ── Best-effort notification (never blocks response) ──
    try {
      if (!isRegistered) {
        // Try smart invite for unregistered users
        const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/smart-invite`;
        const callerProfile = await svc
          .from("profiles")
          .select("name")
          .eq("id", callerId)
          .single();

        const groupData = await svc
          .from("groups")
          .select("name")
          .eq("id", group_id)
          .single();

        fetch(notifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            groupId: group_id,
            phoneNumber: phoneE164,
            groupName: groupData?.data?.name || "المجموعة",
            senderName: callerProfile?.data?.name || "صديقك",
          }),
        }).catch((e) => {
          console.error("Best-effort smart-invite failed:", e);
        });
      }
    } catch (notifyErr) {
      console.error("Notification attempt error:", notifyErr);
      if (!warning) warning = "NOTIFY_FAILED";
    }

    return json({
      ok: true,
      invite_id: inviteId,
      invite_url: inviteUrl,
      member_status: memberStatus,
      is_registered: isRegistered,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("create-phone-invite error:", err);
    return json({ ok: false, reason: "internal_error" }, 500);
  }
});
