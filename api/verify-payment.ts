import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";

async function getPalplussApiKey(supabase: any) {
  let apiKey = process.env.PALPLUSS_API_KEY || "";
  if (!apiKey) {
    try {
      const { data: keyRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "palpluss_api_key")
        .maybeSingle();
      if (keyRow?.value) apiKey = keyRow.value.trim();
    } catch (e) {
      console.warn("Could not read admin_settings for PalPluss:", e);
    }
  }
  return apiKey;
}

async function fulfillPayment(supabase: any, payment: any) {
  if (!payment) return;
  const { id, package_type, amount, user_id, ad_id, banner_id, event_id } = payment;

  if (package_type === "credits" && user_id) {
    const creditAmounts: Record<number, number> = { 5: 5, 10: 10, 20: 20, 50: 50 };
    const creditsToAdd = creditAmounts[Number(amount)] || Number(amount);
    if (creditsToAdd > 0) {
      const { data: existing } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("credits")
          .update({ balance: existing.balance + creditsToAdd, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      } else {
        await supabase.from("credits").insert({ user_id, balance: creditsToAdd });
      }

      await supabase.from("credit_purchases").insert({
        user_id,
        credits_amount: creditsToAdd,
        price: Number(amount),
        payment_id: id,
      });
    }
  }

  if (package_type === "event_ticket") {
    await supabase.from("event_rsvps").update({ status: "confirmed" }).eq("payment_id", id);
    const { data: rsvp } = await supabase.from("event_rsvps").select("event_id").eq("payment_id", id).maybeSingle();
    if (rsvp?.event_id) {
      await supabase.rpc("increment_event_attendees" as any, { target_event_id: rsvp.event_id });
    }
  }

  if (package_type === "banner_creation" && banner_id) {
    await supabase
      .from("banner_campaigns")
      .update({
        status: "active",
        payment_id: id,
        amount_paid: Number(amount || 0),
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", banner_id);
  }

  if ((package_type === "banner_boost" || package_type === "politician_promotion") && banner_id) {
    try {
      await supabase.rpc("apply_banner_promotion" as any, {
        target_banner_id: banner_id,
        paid_amount: Number(amount || 0),
      });
    } catch (e) {
      console.error("apply_banner_promotion rpc error:", e);
    }
    await supabase
      .from("banner_campaigns")
      .update({
        status: "active",
        payment_id: id,
        amount_paid: Number(amount || 0),
        starts_at: new Date().toISOString(),
      })
      .eq("id", banner_id);
  }

  if (package_type === "event_boost" && event_id) {
    try {
      await supabase.rpc("apply_event_promotion" as any, {
        target_event_id: event_id,
        paid_amount: Number(amount || 0),
      });
    } catch (e) {
      console.error("apply_event_promotion rpc error:", e);
    }
  }

  if (ad_id && (package_type === "silver" || package_type === "gold")) {
    const boostDays = package_type === "gold" ? 14 : 7;
    const expiresAt = new Date(Date.now() + boostDays * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("ads")
      .update({
        badge: package_type,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad_id);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    let transactionId = "";

    if (req.method === "GET") {
      transactionId = (req.query?.transaction_id as string) || "";
    } else {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      transactionId = body.transaction_id || "";
    }

    if (!transactionId) {
      return res.status(400).json({ success: false, error: "Transaction ID required" });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
    let paymentQuery = supabase.from("payments").select("*");
    if (isUuid) {
      paymentQuery = paymentQuery.or(`id.eq.${transactionId},transaction_id.eq.${transactionId}`);
    } else {
      paymentQuery = paymentQuery.eq("transaction_id", transactionId);
    }

    let { data: payment, error } = await paymentQuery.maybeSingle();

    if (error || !payment) {
      return res.status(404).json({
        success: false,
        error: "Payment record not found",
        status: "not_found",
      });
    }

    // Active reconciliation: If still pending, check PalPluss API directly
    if (payment.payment_status === "pending") {
      try {
        const apiKey = await getPalplussApiKey(supabase);
        if (apiKey) {
          const checkUrl = isUuid
            ? `https://api.palpluss.com/v1/transactions/${transactionId}`
            : `https://api.palpluss.com/v1/transactions?external_reference=${encodeURIComponent(transactionId)}`;

          const ppRes = await fetch(checkUrl, {
            headers: {
              Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
            },
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

              if (updated) {
                payment = updated;
                await fulfillPayment(supabase, updated);
              }
            } else if (remoteStatus === "FAILED" || remoteStatus === "CANCELLED" || remoteStatus === "EXPIRED") {
              const { data: updated } = await supabase
                .from("payments")
                .update({
                  payment_status: "failed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", payment.id)
                .select()
                .single();

              if (updated) payment = updated;
            }
          }
        }
      } catch (pollErr) {
        console.warn("PalPluss status polling warning:", pollErr);
      }
    }

    return res.status(200).json({
      success: true,
      status: payment.payment_status,
      mpesa_code: payment.mpesa_code,
      amount: Number(payment.amount || 0),
      transaction_id: payment.transaction_id,
    });
  } catch (err: any) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
