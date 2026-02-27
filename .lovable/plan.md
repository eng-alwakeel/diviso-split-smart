
# Fix Phone Invite Flow - Decouple Creation from Sending

## Problem
The current "إضافة وإنشاء دعوة" button calls `sendInvite` which invokes `smart-invite` edge function. If the edge function fails, the entire flow fails and the user sees "خطأ في إرسال الدعوة" with no invite link created.

The flow couples member creation + invite record + notification sending into one fragile chain.

## Root Cause Analysis
1. `handleCreateInvite` in `PhoneInviteTab.tsx` calls `sendInvite()` from `useGroupInvites` hook
2. `sendInvite()` does too many things: checks existing invites, creates referral, creates invite record, calls smart-invite edge function, and if any step fails, the whole operation errors out
3. The smart-invite edge function call is the likely failure point (network/auth issues)
4. Even if invite record is created, if smart-invite fails, the toast shows error and no invite link is returned to the UI

## Solution
Create a new edge function `create-phone-invite` that handles the entire invite creation atomically on the server side, with notification sending as best-effort. The client calls one endpoint and always gets back an invite URL on success.

### 1. New Edge Function: `supabase/functions/create-phone-invite/index.ts`

**Input**: `{ group_id, phone_raw, invitee_name }`
**Auth**: Required (verify JWT in code)

**Server-side steps**:
1. Authenticate caller, verify they are admin/owner of the group
2. Normalize phone to E.164 format
3. Check for existing member in group by phone_e164:
   - If active: return `{ ok: false, reason: 'already_active_member' }`
   - If invited/pending: return existing invite token (idempotent)
   - If archived: unarchive and reuse
4. Look up user by phone in profiles table:
   - If found: create `group_invites` row (status='pending') with `invited_user_id` + send in-app notification (best-effort)
   - If not found: create `invites` row (status='sent') with phone + create `group_join_token`
5. Generate invite URL from token
6. Best-effort: try to send notification/smart-invite, but never fail the response
7. Return: `{ ok: true, invite_url, member_status, invite_id, warning?: 'NOTIFY_FAILED' }`

**Config**: Add `[functions.create-phone-invite]` with `verify_jwt = false` (validate in code per edge function pattern)

### 2. Update `src/components/group/invite-tabs/PhoneInviteTab.tsx`

Replace both `handleInviteKnownUser` and `handleCreateInvite` with a single `handleSubmit` function:

```text
handleSubmit:
  1. Call create-phone-invite edge function
  2. On ok:true -> show invite result panel (link + share buttons)
  3. If warning='NOTIFY_FAILED' -> show warning toast but keep link visible
  4. On ok:false, reason='already_active_member' -> show "already member" message
  5. On ok:false, reason='already_invited' -> show existing invite link (idempotent)
```

- Remove dependency on `useGroupInvites.sendInvite()` for this tab
- Keep `cancelInvite` from the hook for the revoke button
- Unify the two CTA buttons (known user vs unknown) into one since the edge function handles both cases

### 3. Update `supabase/config.toml`

Add:
```toml
[functions.create-phone-invite]
verify_jwt = false
```

## Edge Function Details

The edge function will:
- Use service role client for DB operations
- Normalize phone: strip non-digits, add +966 prefix if needed
- Query `group_members` by `(group_id, phone_e164)` for dedup
- Query `profiles` by `phone` for user lookup
- For registered users: insert into `group_invites` table + create notification
- For unregistered users: insert into `invites` table + call `create_group_join_token` RPC
- Wrap notification sending in try/catch -- never propagate failure
- Return invite URL based on token from `group_join_tokens`

## Client-side Changes Summary

In `PhoneInviteTab.tsx`:
- Single submit handler replaces `handleInviteKnownUser` + `handleCreateInvite`
- Both "found user" and "not found" paths use the same button calling the same edge function
- Warning toast for notify failures: "تم إنشاء الدعوة، لكن تعذر إرسال الإشعار. يمكنك مشاركة الرابط يدويا."
- Idempotent re-submit: shows existing invite link with message "هذا الرقم موجود بالفعل -- تم عرض رابط الدعوة الحالي."

## Files Affected

| File | Change |
|---|---|
| `supabase/functions/create-phone-invite/index.ts` | New edge function |
| `supabase/config.toml` | Add config entry |
| `src/components/group/invite-tabs/PhoneInviteTab.tsx` | Replace dual handlers with single edge function call |
