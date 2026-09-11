create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('daily-grow-views') where exists (select 1 from cron.job where jobname = 'daily-grow-views');

select cron.schedule(
  'daily-grow-views',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://ygwtyyitntauqdghykuf.supabase.co/functions/v1/grow-views',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);