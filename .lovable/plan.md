
# Add "Send Test Email" Button to Broadcast Compose Screen

## Overview
Add a button next to the main send button that allows the admin to send a test email to a specific address before broadcasting to all users. This lets you preview the actual email in your inbox before committing.

## Changes

### 1. Frontend -- `src/components/admin/AdminBroadcastEmail.tsx`

- Add a `testEmail` state (default: admin's email from Supabase auth)
- Add an `Input` field for the test email address above the buttons
- Add a "Send Test" button (`variant="outline"`) next to the main send button
- Add a `testMutation` that calls the same edge function with `test_email` parameter
- Layout: two buttons side by side -- "ارسال تجربة" (outline) + "إرسال لجميع المسجلين" (primary)

### 2. Backend -- `supabase/functions/send-broadcast-email/index.ts`

- After parsing the request body, check for `test_email` field
- If `test_email` is provided:
  - Skip fetching all users
  - Skip creating a campaign record
  - Send only to the provided email address using the same `buildEmailHtml` template
  - Return a simple success/failure response
- If no `test_email`: proceed with existing broadcast logic (no changes)

## UI Layout (Compose Tab)

```text
+--------------------------------------+
| عنوان الإيميل                         |
| [____________________________]       |
|                                      |
| محتوى الإيميل (HTML)                  |
| [____________________________]       |
|                                      |
| نص مختصر (اختياري)                    |
| [____________________________]       |
|                                      |
| إيميل التجربة                         |
| [admin@example.com___________]       |
|                                      |
| [ارسال تجربة 🧪] [إرسال للجميع ◀]    |
+--------------------------------------+
```

## Technical Details

- Test email input validates with basic email format check
- Test mutation is independent from broadcast mutation (separate loading state)
- Edge function differentiates via `test_email` field presence in body
- No campaign record created for test sends
- Same HTML template wrapping applied so test email looks identical to real broadcast
