import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error("Supabase credentials not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    let transactionId = "";
    if (req.method === "GET") {
      const url = new URL(req.url);
      transactionId = url.searchParams.get("transaction_id") || "";
    } else {
      const body = await req.json();
      transactionId = body.transaction_id || "";
    }

    if (!transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (error || !payment) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not found", status: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Active PalPluss reconciliation if still pending
    if (payment.payment_status === "pending") {
      try {
        let apiKey = Deno.env.get("PALPLUSS_API_KEY");
        if (!apiKey) {
          const { data: keyRow } = await supabase
            .from("admin_settings")
            .select("value")
            .eq("key", "palpluss_api_key")
            .maybeSingle();
          if (keyRow?.value) apiKey = keyRow.value.trim();
        }

        if (!apiKey) {
          apiKey = "pp_live_f78f9dbc66c62f23a1beaf0081d81c5ccf46f167a0dba9e3";
        }

        if (apiKey) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
          const checkUrl = isUuid
            ? `https://api.palpluss.com/v1/transactions/${transactionId}`
            : `https://api.palpluss.com/v1/transactions?external_reference=${encodeURIComponent(transactionId)}`;

          const ppRes = await fetch(checkUrl, {
            headers: { Authorization: "Basic " + btoa(`${apiKey}:`) },
          });

          if (ppRes.ok) {
            const ppData = await ppRes.json();
            const tx = ppData?.data?.transaction || ppData?.data || ppData;
            const remoteStatus = String(tx?.status || "").toUpperCase();
            const mpesaReceipt = tx?.mpesa_receipt || tx?.mpesaReceiptNumber || null;

            if (remoteStatus === "SUCCESS") {
              const { data: updated } = await supabase
                .from("payments")
                .update({
                  payment_status: "completed",
                  mpesa_code: mpesaReceipt || payment.mpesa_code || null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", payment.id)
                .select()
                .single();

              if (updated) payment = updated;
            } else if (remoteStatus === "FAILED" || remoteStatus === "CANCELLED" || remoteStatus === "EXPIRED") {
              const { data: updated } = await supabase
                .from("payments")
                .update({ payment_status: "failed", updated_at: new Date().toISOString() })
                .eq("id", payment.id)
                .select()
                .single();
              if (updated) payment = updated;
            }
          }
        }
      } catch (pollErr) {
        console.warn("PalPluss status polling warning in edge function:", pollErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: payment.payment_status,
        mpesa_code: payment.mpesa_code,
        amount: Number(payment.amount || 0),
        transaction_id: payment.transaction_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
