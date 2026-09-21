-- Run this in Supabase SQL Editor AFTER the daily-report function is deployed.
-- It schedules the function to run once a day and requires the pg_cron and
-- pg_net extensions (both available on all Supabase projects, just need enabling).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Runs every day at 18:00 UTC (adjust for Oman time, UTC+4 -> this is 22:00 Muscat).
-- Change the cron expression below to whenever "end of day" should mean for you,
-- e.g. '0 15 * * *' runs at 15:00 UTC = 19:00 Muscat time.
select cron.schedule(
  'glad-daily-report',
  '0 18 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/daily-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR-SERVICE-ROLE-KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check it's scheduled:      select * from cron.job;
-- To remove it later:           select cron.unschedule('glad-daily-report');
