

# Fix Phone Invite Flow - Remove Sending, Fix DB Trigger

## Root Cause
The `trg_invites_usage_fn` trigger on the `invites` table references `NEW.inviter_id`, a column that does not exist. Every INSERT into `invites` fails with:
```
record "new" has no field "inviter_id"
```
This is why the user sees "خطأ في إنشاء الدعوة" every time.

## Plan

### 1. DB Migration: Fix the broken trigger function

Fix `trg_invites_usage_fn` to use `NEW.created_by` instead of `NEW.inviter_id`:

```sql
CREATE OR REPLACE FUNCTION public.trg_invites_usage_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.increment_usage(NEW.created_by, 'invite_sent');
  RETURN NEW;
END; $$;
```

No index changes needed -- `idx_group_members_group_phone` already has the `archived_at IS NULL` filter.

### 2. Rewrite Edge Function: `create-phone-invite/index.ts`

Complete rewrite to remove ALL notification/sending logic. The new flow:

1. Auth + validate caller is admin/owner
2. Normalize phone to E.164
3. Check existing `group_members` by `(group_id, phone_e164)` where `archived_at IS NULL`:
   - If found with status active: return `already_active_member`
   - If found with status invited/pending: idempotent -- reuse, find/create token, return existing link
4. Lookup user by phone in `profiles`:
   - If registered: insert `group_members` with `status='invited'`, `user_id` set
   - If not registered: require `invitee_name`; insert `group_members` with `status='pending'`, `phone_e164` set, `user_id=NULL`
5. Also insert into `invites` table for tracking (with the fixed trigger)
6. Create join token via `create_group_join_token` RPC
7. Return `{ ok: true, member_id, member_status, invite_url, is_registered }`

**Removed entirely**: smart-invite call, notification fetch, `NOTIFY_FAILED` warning field, `group_invites` table usage for registered users.

### 3. Update Client UI: `PhoneInviteTab.tsx`

Changes:
- Remove the `NOTIFY_FAILED` warning toast handler (line 194-195) -- no longer returned
- Remove "سيتم إرسال دعوة للموافقة" text (line 303) -- replace with "تم إضافة العضو بانتظار الموافقة"
- Change status label "تم الإرسال" to "تم الإنشاء" (line 268)
- Remove `Send` icon import (no longer used in "إنشاء دعوة جديدة" button) -- use `UserPlus` instead
- Button label for found users: change from "دعوة هذا الشخص" to "إضافة وإنشاء دعوة" (unified label, line 484)

### Files Affected

| File | Change |
|---|---|
| DB Migration | Fix `trg_invites_usage_fn` to use `created_by` |
| `supabase/functions/create-phone-invite/index.ts` | Rewrite: remove notification logic, add group_members insert |
| `src/components/group/invite-tabs/PhoneInviteTab.tsx` | Remove sending-related text and warning handling |

