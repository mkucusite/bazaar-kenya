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
    const PALPLUSS_API_KEY = Deno.env.get('PALPLUSS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Resolve active payment provider from admin_settings (default: palpluss)
    const { data: providerSetting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'payment_provider')
      .maybeSingle();
    const activeProvider = (providerSetting?.value as string) || 'palpluss';

    if (activeProvider === 'payhero' && (!PAYHERO_USERNAME || !PAYHERO_PASSWORD || !PAYHERO_CHANNEL)) {
      throw new Error('PayHero credentials not configured');
    }
    if (activeProvider === 'palpluss' && !PALPLUSS_API_KEY) {
      throw new Error('PalPluss API key not configured');
    }

    const { phone, amount, package_type, ad_id, banner_id, user_id } = await req.json();

    let effectiveAmount = Number(amount);

    if (package_type === 'banner_boost' && effectiveAmount < 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum banner boost amount is KSh 500' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (package_type === 'politician_promotion' && effectiveAmount < 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum banner boost amount is KSh 500' }),
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

    // Save payment row first so callback can match even if it arrives quickly
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

    if (dbError || !payment) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markFailed = async (msg: string) => {
      await supabase
        .from('payments')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('transaction_id', externalReference);
      return new Response(
        JSON.stringify({ success: false, error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    };

    try {
      if (activeProvider === 'palpluss') {
        const palBody = {
          amount: Number(effectiveAmount),
          phone: normalizedPhone,
          accountReference: externalReference,
          transactionDesc: `KenyaAdvert ${(package_type || 'payment').slice(0, 40)}`,
          callbackUrl,
        };
        console.log('Initiating PalPluss payment:', palBody);
        const palResp = await fetch('https://api.palpluss.com/v1/payments/stk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${PALPLUSS_API_KEY}:`),
          },
          body: JSON.stringify(palBody),
        });
        const palResult = await palResp.json().catch(() => ({}));
        console.log('PalPluss response:', palResult);
        if (!palResp.ok || palResult?.success === false) {
          if (!PAYHERO_USERNAME || !PAYHERO_PASSWORD || !PAYHERO_CHANNEL) {
            const msg = palResult?.error?.message || palResult?.message || 'PalPluss payment initiation failed';
            return await markFailed(msg);
          }
          console.warn('PalPluss failed; falling back to PayHero:', palResult);
          const payHeroData = {
            amount: Number(effectiveAmount),
            phone_number: normalizedPhone,
            channel_id: Number(PAYHERO_CHANNEL),
            provider: 'm-pesa',
            external_reference: externalReference,
            customer_name: 'KenyaAdvert Customer',
            callback_url: callbackUrl,
          };
          const payHeroResponse = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(`${PAYHERO_USERNAME}:${PAYHERO_PASSWORD}`),
            },
            body: JSON.stringify(payHeroData),
          });
          const payHeroResult = await payHeroResponse.json().catch(() => ({}));
          if (!payHeroResponse.ok) {
            const msg = payHeroResult.error_message || payHeroResult.message || palResult?.message || 'Payment initiation failed';
            return await markFailed(msg);
          }
        }
      } else {
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
        const payHeroResult = await payHeroResponse.json().catch(() => ({}));
        console.log('PayHero response:', payHeroResult);
        if (!payHeroResponse.ok) {
          const errorMsg = payHeroResult.error_message || payHeroResult.message || 'Payment initiation failed';
          return await markFailed(errorMsg);
        }
      }
    } catch (gatewayError) {
      console.error('Provider request failed:', gatewayError);
      const msg = gatewayError instanceof Error ? gatewayError.message : 'Payment provider unreachable';
      return await markFailed(msg);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        transaction_id: externalReference,
        provider: activeProvider,
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
