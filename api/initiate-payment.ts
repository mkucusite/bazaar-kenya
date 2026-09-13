import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";

function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/\D+/g, "");
  if (/^254\d{9}$/.test(phone)) return phone;
  if (/^07\d{8}$/.test(phone)) return "254" + phone.substring(1);
  if (/^011\d{7}$/.test(phone)) return "254" + phone.substring(1);
  if (/^01\d{8}$/.test(phone)) return "254" + phone.substring(1);
  if (/^\+254\d{9}$/.test(phone)) return phone.substring(1);
  return phone;
}

function shortRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "KA";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function shortDesc(pkg?: string): string {
  const map: Record<string, string> = {
    credits: "Credits",
    banner_basic_banner: "Banner",
    banner_creation: "Banner",
    banner_boost: "Boost",
    event_boost: "Event Boost",
    politician_promotion: "Promote",
    event_ticket: "Event Ticket",
    silver: "Silver Boost",
    gold: "Gold Boost",
    standard: "KenyaAdvert",
  };
  const key = (pkg || "standard").split(":")[0];
  const v = map[key] || "KenyaAdvert";
  return v.slice(0, 13);
}

async function getPalplussCredentials(supabase: any) {
  let apiKey = process.env.PALPLUSS_API_KEY || "";
  let channelId = process.env.PALPLUSS_CHANNEL_ID || "";

  if (!apiKey) {
    try {
      const { data: keyRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "palpluss_api_key")
        .maybeSingle();
      if (keyRow?.value) apiKey = keyRow.value.trim();

      const { data: channelRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "palpluss_channel_id")
        .maybeSingle();
      if (channelRow?.value) channelId = channelRow.value.trim();
    } catch (e) {
      console.warn("Could not read admin_settings for PalPluss:", e);
    }
  }

  if (!apiKey) {
    try {
      const { data: scRow } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "palpluss_api_key")
        .maybeSingle();
      if (scRow?.value) apiKey = scRow.value.trim();

      const { data: scChannel } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "palpluss_channel_id")
        .maybeSingle();
      if (scChannel?.value) channelId = scChannel.value.trim();
    } catch (e) {
      console.warn("Could not read site_config for PalPluss:", e);
    }
  }

  if (!apiKey) {
    apiKey = "pp_live_f78f9dbc66c62f23a1beaf0081d81c5ccf46f167a0dba9e3";
  }
  if (!channelId) {
    channelId = "df30569b-6c7d-41da-8e9c-4d22f91e0469";
  }

  return { apiKey, channelId };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      phone,
      amount,
      package_type,
      ad_id,
      banner_id,
      event_id,
      product_id,
      user_id,
      campaign,
    } = body;

    const effectiveAmount = Number(amount);

    if (package_type === "banner_boost" && effectiveAmount < 500) {
      return res.status(400).json({ success: false, error: "Minimum banner boost amount is KSh 500" });
    }
    if (package_type === "event_boost" && effectiveAmount < 500) {
      return res.status(400).json({ success: false, error: "Minimum event boost amount is KSh 500" });
    }
    if (package_type === "politician_promotion" && effectiveAmount < 500) {
      return res.status(400).json({ success: false, error: "Minimum banner boost amount is KSh 500" });
    }
    if (!phone || !effectiveAmount || effectiveAmount <= 0) {
      return res.status(400).json({ success: false, error: "Valid phone and amount required" });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!/^254\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: "Invalid Kenyan phone number (e.g. 0712345678)" });
    }

    const { apiKey, channelId } = await getPalplussCredentials(supabase);
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "PalPluss API key not configured. Please set your PalPluss API key in Admin Settings or Supabase.",
      });
    }

    const externalReference = shortRef(); // 12 chars
    const transactionDesc = shortDesc(package_type); // <= 13 chars
    const callbackUrl = "https://www.kenyaadverts.com/api/payment-callback";

    let effectiveBannerId = banner_id || null;
    if (package_type === "politician_promotion" && !effectiveBannerId && campaign?.business_name && campaign?.target_url) {
      const { data: existing } = await supabase
        .from("banner_campaigns")
        .select("id")
        .eq("category", "politician")
        .eq("target_url", campaign.target_url)
        .limit(1)
        .maybeSingle();

      effectiveBannerId = existing?.id || null;
      if (!effectiveBannerId) {
        const image = campaign.banner_image || "/og-image.png";
        const { data: created, error: campaignError } = await supabase
          .from("banner_campaigns")
          .insert({
            user_id: user_id || null,
            business_name: campaign.business_name,
            description: campaign.description || `${campaign.business_name} political profile.`,
            target_url: campaign.target_url,
            category: "politician",
            banner_image: image,
            gallery_images: [image],
            position: "profile_boost",
            status: "pending_payment",
            is_listed: true,
            package_type: "politician_profile_boost",
            country: "Kenya",
            county: campaign.county || null,
            running_position: campaign.running_position || null,
            party_name: campaign.party_name || null,
            slogan: campaign.slogan || null,
          })
          .select("id")
          .single();

        if (campaignError || !created) {
          console.error("Campaign creation error:", campaignError);
          return res.status(500).json({
            success: false,
            error: campaignError?.message || "Failed to create promotion",
          });
        }
        effectiveBannerId = created.id;
      }
    }

    // Save pending payment record in DB
    const { data: payment, error: dbError } = await supabase
      .from("payments")
      .insert({
        user_id: user_id || null,
        phone_number: normalizedPhone,
        amount: Number(effectiveAmount),
        payment_status: "pending",
        transaction_id: externalReference,
        package_type: package_type || "standard",
        ad_id: ad_id || null,
        banner_id: effectiveBannerId,
        event_id: event_id || null,
        product_id: product_id || null,
      })
      .select()
      .single();

    if (dbError || !payment) {
      console.error("Database error saving payment:", dbError);
      return res.status(500).json({ success: false, error: "Failed to create payment record" });
    }

    const markFailed = async (msg: string) => {
      await supabase
        .from("payments")
        .update({ payment_status: "failed", updated_at: new Date().toISOString() })
        .eq("transaction_id", externalReference);
      return res.status(400).json({ success: false, error: msg });
    };

    // PalPluss STK Push API call
    try {
      const palBody: Record<string, any> = {
        amount: Number(effectiveAmount),
        phone: normalizedPhone,
        accountReference: externalReference,
        transactionDesc,
        callbackUrl,
      };
      if (channelId) {
        palBody.channelId = channelId;
      }

      console.log("Calling PalPluss STK push:", {
        phone: normalizedPhone,
        amount: effectiveAmount,
        ref: externalReference,
        hasChannel: !!channelId,
      });

      const palResp = await fetch("https://api.palpluss.com/v1/payments/stk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
        },
        body: JSON.stringify(palBody),
      });

      const palResult = await palResp.json().catch(() => ({}));
      console.log("PalPluss response:", JSON.stringify(palResult));

      if (!palResp.ok || palResult?.success === false) {
        const msg =
          palResult?.error?.message ||
          palResult?.message ||
          `PalPluss STK error (${palResp.status})`;
        return await markFailed(msg);
      }

      const palTxId = palResult?.data?.transactionId;

      return res.status(200).json({
        success: true,
        payment_id: payment.id,
        transaction_id: externalReference,
        palpluss_transaction_id: palTxId || null,
        provider: "palpluss",
        message: "STK Push sent. Check your phone.",
      });
    } catch (apiError) {
      console.error("PalPluss gateway unreachable:", apiError);
      const msg = apiError instanceof Error ? apiError.message : "Payment provider unreachable";
      return await markFailed(msg);
    }
  } catch (err: any) {
    console.error("Internal payment error:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
