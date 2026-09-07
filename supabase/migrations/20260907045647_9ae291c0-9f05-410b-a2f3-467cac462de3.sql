create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('daily-grow-views') where exists (select 1 from cron.job where jobname = 'daily-grow-views');

select cron.schedule(
  'daily-grow-views',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/grow-views',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdGhsb3BmaHl1dXNwZ29vYmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDc0ODcsImV4cCI6MjA4ODQyMzQ4N30.PQ4Nviecc9-RgW2iHfHD6tGA4B1tAWMp7KLHG72hy_I"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);