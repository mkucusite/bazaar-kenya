import { getSupabase, getPalplussCredentials } from "./_utils";

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
