

# Fix: Incorrect days_inactive (999) + Group Notifications Not Arriving

## Problem 1: "999 يوم ما تحركت" is wrong

The `compute_daily_hub` function determines inactivity based on `user_action_log`. Your account has zero entries in this table because `logAction` is only called for specific actions (adding expenses, etc.). Since you have no logged actions, the function defaults `days_since_last_action` to 999.

**Fix:** Modify `compute_daily_hub` to also consider `profiles.last_active_at` as a fallback when `user_action_log` is empty. Your profile shows `last_active_at = 2026-02-26`, so this will give accurate results.

### SQL change in `compute_daily_hub`:

```text
Before:
  SELECT MAX(created_at) INTO v_last_action_at
  FROM user_action_log WHERE user_id = p_user_id;

After:
  SELECT MAX(created_at) INTO v_last_action_at
  FROM user_action_log WHERE user_id = p_user_id;

  -- Fallback: use last_active_at from profiles if no action log entries
  IF v_last_action_at IS NULL THEN
    SELECT last_active_at INTO v_last_action_at
    FROM profiles WHERE id = p_user_id;
  END IF;
```

---

## Problem 2: Group member notifications not arriving

The RLS INSERT policy on the `notifications` table is:

```text
WITH CHECK (user_id = auth.uid())
```

This means a user can only insert notifications **for themselves**. When `notifyMemberJoined` (client-side) tries to insert notifications for other group members, the rows are silently rejected.

**Fix:** Move the member_joined notification logic to the database level inside the `join_group_with_token` function (which is `SECURITY DEFINER` and bypasses RLS), similar to how `respond_group_invite` already handles `group_invite_accepted` notifications.

### SQL change in `join_group_with_token`:

Add this block after the existing member insert, before `RETURN`:

```text
-- Notify other group members about the new member
INSERT INTO notifications (user_id, type, payload)
SELECT
  gm.user_id,
  'member_joined',
  jsonb_build_object(
    'group_name', (SELECT name FROM groups WHERE id = v_token_record.group_id),
    'group_id', v_token_record.group_id,
    'member_name', (SELECT COALESCE(display_name, name, 'عضو جديد')
                    FROM profiles WHERE id = v_user_id)
  )
FROM group_members gm
WHERE gm.group_id = v_token_record.group_id
  AND gm.user_id != v_user_id;
```

---

## Problem 3: Clean up old incorrect notifications

Run a one-time cleanup to delete/archive the stale `daily_engagement` notifications with `days_inactive: 999`.

### SQL cleanup:

```text
UPDATE notifications
SET archived_at = now(), read_at = COALESCE(read_at, now())
WHERE type = 'daily_engagement'
  AND (payload->>'days_inactive')::int >= 30;
```

---

## Summary of changes

1. **Migration SQL** -- Update `compute_daily_hub` to fallback to `profiles.last_active_at`
2. **Migration SQL** -- Update `join_group_with_token` to insert `member_joined` notifications server-side
3. **Migration SQL** -- Archive old incorrect `daily_engagement` notifications with 999 days
4. **No frontend changes needed** -- the existing `useNotifications` already handles `member_joined` type correctly; we just need the notifications to actually get inserted
