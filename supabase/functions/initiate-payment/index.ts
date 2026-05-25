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
  if (/^01\d{8}$/.test(phone)) return '254' + phone.substring(1);
  if (/^\+254\d{9}$/.test(phone)) return phone.substring(1);
  return phone;
}

// PalPluss limits: accountReference <=12 chars, transactionDesc <=13 chars
function shortRef(): string {
  // 12 chars, alphanumeric, no dashes
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'KA';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function shortDesc(pkg?: string): string {
  // 13 chars max
  const map: Record<string, string> = {
    credits: 'Credits',
    banner_basic_banner: 'Banner',
    banner_creation: 'Banner',
    banner_boost: 'Boost',
    event_boost: 'Event Boost',
    politician_promotion: 'Promote',
    event_ticket: 'Event Ticket',
    silver: 'Silver Boost',
    gold: 'Gold Boost',
    standard: 'KenyaAdvert',
  };
  const key = (pkg || 'standard').split(':')[0];
  const v = map[key] || 'KenyaAdvert';
  return v.slice(0, 13);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PALPLUSS_API_KEY = Deno.env.get('PALPLUSS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase credentials not configured');
    }
    if (!PALPLUSS_API_KEY) {
      throw new Error('PalPluss API key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { phone, amount, package_type, ad_id, banner_id, event_id, user_id } = await req.json();

    const effectiveAmount = Number(amount);

    if (package_type === 'banner_boost' && effectiveAmount < 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum banner boost amount is KSh 500' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (package_type === 'event_boost' && effectiveAmount < 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum event boost amount is KSh 500' }),
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
    if (!/^254\d{9}$/.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Kenyan phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const externalReference = shortRef(); // 12 chars
    const transactionDesc = shortDesc(package_type); // <=13 chars
    const callbackUrl = `${SUPABASE_URL}/functions/v1/payment-callback`;

    // Save payment row first
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
        event_id: event_id || null,
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
      const palBody = {
        amount: Number(effectiveAmount),
        phone: normalizedPhone,
        accountReference: externalReference, // 12 chars
        transactionDesc, // <=13 chars
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
      console.log('PalPluss response:', JSON.stringify(palResult));

      if (!palResp.ok || palResult?.success === false) {
        const msg = palResult?.error?.message || palResult?.message || `PalPluss error (${palResp.status})`;
        return await markFailed(msg);
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
        provider: 'palpluss',
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
