import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";

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

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    console.log("Payment callback received:", JSON.stringify(rawBody));

    let providerStatus = "";
    let mpesaCode: string | undefined;
    const candidateRefs: string[] = [];
    const pushRef = (v: unknown) => {
      if (typeof v === "string" && v.trim()) candidateRefs.push(v.trim());
    };

    // PayHero format support:
    if (rawBody?.response && (rawBody.response.ExternalReference || rawBody.response.Status)) {
      const r = rawBody.response || {};
      providerStatus = String(r.Status || "").toLowerCase();
      mpesaCode = r.MpesaReceiptNumber;
      pushRef(r.ExternalReference);
    } else {
      // PalPluss format:
      const tx = rawBody?.transaction || rawBody?.data || rawBody || {};
      providerStatus = String(
        tx.status || rawBody?.status || rawBody?.event_type || rawBody?.event || tx.result_desc || tx.resultDescription || ""
      ).toLowerCase();
      mpesaCode =
        tx.mpesa_receipt ||
        tx.mpesa_receipt_number ||
        tx.mpesaReceiptNumber ||
        tx.MpesaReceiptNumber ||
        tx.receipt_number ||
        tx.receipt ||
        undefined;

      pushRef(tx.external_reference);
      pushRef(tx.externalReference);
      pushRef(tx.account_reference);
      pushRef(tx.accountReference);
      pushRef(tx.reference);
      pushRef(tx.id);
      pushRef(rawBody?.account_reference);
      pushRef(rawBody?.accountReference);
      pushRef(rawBody?.reference);
    }

    if (!candidateRefs.length || !providerStatus) {
      console.warn("Missing required fields in payment callback:", { providerStatus, candidateRefs });
      return res.status(200).json({ success: false, message: "Awaiting valid reference" });
    }

    const s = providerStatus;
    const isSuccess = s.includes("success") || s.includes("complet") || s.includes("paid");
    const newStatus = isSuccess ? "completed" : "failed";

    // Find matching payment row across candidate refs
    let foundPayment: any = null;
    for (const ref of candidateRefs) {
      const { data: row } = await supabase
        .from("payments")
        .select("*")
        .eq("transaction_id", ref)
        .maybeSingle();

      if (row) {
        foundPayment = row;
        break;
      }
    }

    if (!foundPayment) {
      console.warn("No matching payment row found for candidate refs:", candidateRefs);
      // Return 200 so provider does not endlessly retry an unknown reference
      return res.status(200).json({ success: false, message: "Payment record not found" });
    }

    // Idempotency: if already completed, acknowledge and exit
    if (foundPayment.payment_status === "completed") {
      return res.status(200).json({ success: true, message: "Already completed" });
    }

    // Update payment record
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: newStatus,
        mpesa_code: mpesaCode || foundPayment.mpesa_code || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", foundPayment.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment status in DB:", updateError);
      return res.status(500).json({ success: false, error: "Database update error" });
    }

    // Fulfill purchase if successful
    if (newStatus === "completed" && updatedPayment) {
      await fulfillPayment(supabase, updatedPayment);
    }

    console.log(`Payment ${foundPayment.transaction_id} updated to ${newStatus}`);
    return res.status(200).json({
      success: true,
      status: newStatus,
      transaction_id: foundPayment.transaction_id,
    });
  } catch (error: any) {
    console.error("Callback handler error:", error);
    // Return 200 so provider won't hammer the webhook on transient errors
    return res.status(200).json({ success: false, error: error?.message || "Handler error" });
  }
}
