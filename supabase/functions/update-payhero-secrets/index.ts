import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Missing config');

    // Verify the caller is an admin
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin role
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { username, password, channel_id } = await req.json();

    // Store in site_config for reference
    const updates: { key: string; value: string; secret_env: string }[] = [];
    if (username?.trim()) updates.push({ key: 'payhero_username', value: username.trim(), secret_env: 'PAYHERO_API_USERNAME' });
    if (password?.trim()) updates.push({ key: 'payhero_password', value: '●●●●●●', secret_env: 'PAYHERO_API_PASSWORD' });
    if (channel_id?.trim()) updates.push({ key: 'payhero_channel_id', value: channel_id.trim(), secret_env: 'PAYHERO_CHANNEL_ID' });

    for (const u of updates) {
      const { data: existing } = await supabase.from('site_config').select('id').eq('key', u.key).single();
      if (existing) {
        await supabase.from('site_config').update({ value: u.value, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('site_config').insert({ key: u.key, value: u.value });
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'PayHero config reference saved. To update the actual API secrets, use the platform secrets manager.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
