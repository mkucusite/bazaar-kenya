import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/\D+/g, '');
  if (/^254\d{9}$/.test(phone)) return phone;
  if (/^07\d{8}$/.test(phone)) return '254' + phone.substring(1);
  if (/^011\d{7}$/.test(phone)) return '254' + phone.substring(1);
  if (/^\+254\d{9}$/.test(phone)) return phone.substring(1);
  return phone;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYHERO_USERNAME = Deno.env.get('PAYHERO_API_USERNAME');
    const PAYHERO_PASSWORD = Deno.env.get('PAYHERO_API_PASSWORD');
    const PAYHERO_CHANNEL = Deno.env.get('PAYHERO_CHANNEL_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PAYHERO_USERNAME || !PAYHERO_PASSWORD || !PAYHERO_CHANNEL) {
      throw new Error('PayHero credentials not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { phone, amount, package_type, ad_id, banner_id, user_id } = await req.json();

    // ----- Admin flat-price override -----
    // If the caller is an authenticated admin, force the amount to the
    // configured flat price (defaults to KSh 5). Admins can disable this
    // by setting site_config.admin_flat_price_enabled = 'false'.
    let effectiveAmount = Number(amount);
    try {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        const callerId = userData?.user?.id;
        if (callerId) {
          const { data: roleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', callerId)
            .eq('role', 'admin')
            .maybeSingle();
          if (roleRow) {
            const { data: enabledCfg } = await supabase
              .from('site_config')
              .select('value')
              .eq('key', 'admin_flat_price_enabled')
              .maybeSingle();
            if (enabledCfg?.value !== 'false') {
              const { data: amountCfg } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', 'admin_flat_price_amount')
                .maybeSingle();
              const parsed = Number(amountCfg?.value);
              effectiveAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
              console.log(`Admin override: forcing amount to KSh ${effectiveAmount} for user ${callerId}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Admin override check failed (non-fatal):', e);
    }

    if (package_type === 'politician_promotion' && effectiveAmount < 5000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum politician promotion amount is KSh 5,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone || !effectiveAmount || effectiveAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and valid amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const externalReference = `KA-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const callbackUrl = `${SUPABASE_URL}/functions/v1/payment-callback`;

    const payHeroData = {
      amount: Number(effectiveAmount),
      phone_number: normalizedPhone,
      channel_id: Number(PAYHERO_CHANNEL),
      provider: 'm-pesa',
      external_reference: externalReference,
      customer_name: 'KenyaAdvert Customer',
      callback_url: callbackUrl,
    };

    console.log('Initiating PayHero payment:', payHeroData);

    const payHeroResponse = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${PAYHERO_USERNAME}:${PAYHERO_PASSWORD}`),
      },
      body: JSON.stringify(payHeroData),
    });

    const payHeroResult = await payHeroResponse.json();
    console.log('PayHero response:', payHeroResult);

    if (!payHeroResponse.ok) {
      const errorMsg = payHeroResult.error_message || payHeroResult.message || 'Payment initiation failed';
      console.error('PayHero error:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user_id || null,
        phone_number: normalizedPhone,
        amount: Number(effectiveAmount),
        payment_status: 'pending',
        transaction_id: externalReference,
        package_type: package_type || 'standard',
        ad_id: ad_id || null,
        banner_id: banner_id || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        transaction_id: externalReference,
        message: 'STK Push sent. Check your phone.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
