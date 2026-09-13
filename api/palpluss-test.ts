import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";

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
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    let apiKey = body.apiKey?.trim();

    if (!apiKey) {
      const creds = await getPalplussCredentials(supabase);
      apiKey = creds.apiKey;
    }

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "No API key provided or found in settings",
      });
    }

    // Call PalPluss service wallet balance endpoint
    const response = await fetch("https://api.palpluss.com/v1/wallets/service/balance", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.success === false) {
      const errMsg = data?.error?.message || data?.message || `HTTP ${response.status}: Invalid key or connection failed`;
      return res.status(400).json({
        success: false,
        error: errMsg,
      });
    }

    const wallet = data?.data || data;
    return res.status(200).json({
      success: true,
      balance: wallet?.balance ?? 0,
      currency: wallet?.currency || "KES",
      message: `Connected successfully! PalPluss Service Wallet Balance: KES ${wallet?.balance ?? 0}`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to test PalPluss connection",
    });
  }
}
