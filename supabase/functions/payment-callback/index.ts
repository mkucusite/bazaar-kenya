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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Supabase credentials not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const rawBody = await req.text();
    console.log('Callback received:', rawBody);
    const data = JSON.parse(rawBody);

    const response = data.response || {};
    const externalReference = response.ExternalReference;
    const payheroStatus = (response.Status || '').toLowerCase();
    const mpesaCode = response.MpesaReceiptNumber;

    if (!externalReference || !payheroStatus) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = payheroStatus === 'success' ? 'completed' : 'failed';

    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        payment_status: newStatus,
        mpesa_code: mpesaCode || null,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', externalReference)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If payment successful and it's a credit bundle, add credits
    if (newStatus === 'completed' && payment.package_type === 'credits' && payment.user_id) {
      const creditAmounts: Record<number, number> = { 5: 5, 10: 10, 20: 20, 50: 50 };
      const creditsToAdd = creditAmounts[payment.amount] || 0;
      
      if (creditsToAdd > 0) {
        const { data: existing } = await supabase
          .from('credits')
          .select('balance')
          .eq('user_id', payment.user_id)
          .single();

        if (existing) {
          await supabase.from('credits').update({ balance: existing.balance + creditsToAdd, updated_at: new Date().toISOString() }).eq('user_id', payment.user_id);
        } else {
          await supabase.from('credits').insert({ user_id: payment.user_id, balance: creditsToAdd });
        }

        await supabase.from('credit_purchases').insert({
          user_id: payment.user_id,
          credits_amount: creditsToAdd,
          price: payment.amount,
          payment_id: payment.id,
        });
      }
    }

    // Event ticket payment — confirm RSVP
    if (newStatus === 'completed' && payment.package_type === 'event_ticket') {
      await supabase.from('event_rsvps').update({ status: 'confirmed' }).eq('payment_id', payment.id);
      const { data: rsvp } = await supabase.from('event_rsvps').select('event_id').eq('payment_id', payment.id).single();
      if (rsvp?.event_id) {
        await supabase.rpc('increment_event_attendees', { target_event_id: rsvp.event_id });
      }
    }

    // Banner campaign payment — activate campaign
    if (newStatus === 'completed' && payment.package_type?.startsWith('banner_')) {
      await supabase.from('banner_campaigns').update({
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('payment_id', payment.id);
    }

    // Open politician promotion — no login required, promote an existing campaign banner
    if (newStatus === 'completed' && payment.package_type === 'politician_promotion' && payment.banner_id) {
      await supabase.rpc('apply_banner_promotion', {
        target_banner_id: payment.banner_id,
        paid_amount: Number(payment.amount || 0),
      });
    }

    // If payment successful and it's a badge upgrade, set expires_at
    if (newStatus === 'completed' && payment.ad_id && (payment.package_type === 'silver' || payment.package_type === 'gold')) {
      const boostDays = payment.package_type === 'gold' ? 14 : 7;
      const expiresAt = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('ads').update({ badge: payment.package_type, expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('id', payment.ad_id);
    }

    console.log('Payment updated:', payment?.id, 'Status:', newStatus);

    return new Response(
      JSON.stringify({ success: true, status: newStatus, transaction_id: externalReference }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
