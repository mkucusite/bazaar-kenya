import { getSupabase, fulfillPayment } from "./_utils";

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
    const supabase = getSupabase();
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
