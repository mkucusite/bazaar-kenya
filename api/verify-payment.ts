import { getSupabase, getPalplussCredentials, fulfillPayment } from "./_utils";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const supabase = getSupabase();
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

    // Lookup payment by transaction_id or id
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
        const { apiKey } = await getPalplussCredentials(supabase);
        if (apiKey) {
          // If transactionId is PalPluss UUID or we check by external_reference
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
