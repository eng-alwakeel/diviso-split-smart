

# Fix Daily Engagement Notifications Display + Reduce Frequency

## Problem
1. `daily_engagement` notifications show as "إشعار جديد" because all 3 display components lack a case for this type
2. The payload already contains `message_ar` and `message_en` - we just need to use them
3. Notifications send daily even when `days_inactive` is 999 (likely a data issue in `daily_hub_cache`)

## Changes

### 1. Add `daily_engagement` case to notification display (3 files)

**`src/hooks/useNotifications.ts`** - Add to both `getNotificationTitle` and `getNotificationDescription`:
- Title: return a new translation key `titles.daily_engagement` ("تذكير يومي" / "Daily Reminder")
- Description: return `payload.message_ar` or `payload.message_en` based on current language (payload already has both)

**`src/pages/Notifications.tsx`** - Add to `getNotificationIcon` and `getNotificationText`:
- Icon: `📊` for daily engagement
- Text: use `payload.message_ar` or `payload.message_en` based on language

**`src/components/NotificationBell.tsx`** - Add to `getNotificationText`:
- Same logic: use payload message based on language

### 2. Add translation keys (2 files)

**`src/i18n/locales/ar/notifications.json`**:
- Add `types.daily_engagement`, `titles.daily_engagement`, `descriptions.daily_engagement`

**`src/i18n/locales/en/notifications.json`**:
- Same keys in English

### 3. Reduce notification frequency (DB migration)

Update the `send_daily_engagement_notifications` function to:
- Skip users with `days_inactive >= 30` (truly dormant users don't benefit from nudges)
- For `low_activity` users, only send every 3 days instead of daily (check `last_daily_notification_at < now() - interval '3 days'` for low_activity)
- Keep daily for `active` users (streak reminders are time-sensitive)

### 4. Handle click navigation

Add `daily_engagement` to click handlers in `NotificationBell.tsx` and `Notifications.tsx` to navigate to `/` (dashboard) since these are general engagement prompts.

## Technical Details

The DB function `send_daily_engagement_notifications` stores `message_ar` and `message_en` in the payload. The fix is straightforward: read the correct message from payload based on `i18n.language` instead of relying on translation keys. This also future-proofs the system since messages are generated dynamically with streak counts and days.

