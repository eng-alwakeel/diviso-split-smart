
# Fix: Monthly Founding Credits Not Being Granted

## Problem
User #4 (Hijaziun) and all other founding users have never received their 50 monthly points. The `grant-monthly-credits` edge function exists and works correctly, but **no cron job is set up** to call it. The function has literally never been executed.

## Root Cause
- A `pg_cron` job exists for `daily-engagement-cron` (runs daily at 5:00 AM)
- No equivalent cron job exists for `grant-monthly-credits`
- Result: zero `founding_monthly` records in the entire database

## Fix

### 1. Create a monthly cron job via SQL migration

Add a `pg_cron` job that calls `grant-monthly-credits` on the 1st of every month at 6:00 AM UTC:

```sql
SELECT cron.schedule(
  'grant-monthly-credits',
  '0 6 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/grant-monthly-credits',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{"time": "monthly"}'::jsonb
  ) as request_id;
  $$
);
```

### 2. Manually trigger the function now

After the cron is set up, manually invoke the edge function once so all qualifying founding users (those active in the last 30 days) receive their February credits immediately. This will be done via the `curl_edge_functions` tool.

### Qualifying Users (active in last 30 days)
Based on the data, the following founding users have recent activity and will receive 50 credits:
- User #1 (adel alwakeel) -- active Feb 17
- User #4 (Hijaziun) -- active Feb 8
- User #7 (Fares) -- active Feb 2
- User #9 (Jawaher) -- active Feb 3
- User #13 (Faten) -- active Feb 1
- User #14 (Esraa) -- active Feb 4
- User #15 (Alwakeel CTO) -- active Feb 9
- User #17 (Amr Salama) -- active Feb 5

### No code changes needed
The edge function logic is correct. Only infrastructure (cron) is missing.
