
SELECT cron.schedule(
  'auto-confirm-expired-settlements',
  '0 * * * *',
  $$SELECT public.auto_confirm_expired_settlements()$$
);
