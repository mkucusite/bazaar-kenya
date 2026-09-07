// Read-only parity check: row counts on this backend vs the external project,
// plus auth user counts. No secrets are ever returned in the response.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SRC_URL = Deno.env.get("SUPABASE_URL")!;
const SRC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DST_URL = (Deno.env.get("EXTERNAL_SUPABASE_URL") || "").replace(/\/$/, "");
const DST_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY") || "";

const TABLES = [
  "categories", "subcategories", "profiles", "user_roles", "political_parties", "site_pages",
  "site_config", "admin_settings", "seo_settings", "seo_url_index", "blog_posts",
  "digital_products", "directory_profiles", "business_profiles", "credits", "ads", "payments",
  "credit_purchases", "banner_campaigns", "banner_votes", "banner_likes", "events",
  "event_rsvps", "ad_reports", "reviews", "favourites", "conversations", "messages",
  "notifications", "alerts", "advertiser_requests", "blog_comments",
  "politician_edit_requests", "login_logs", "email_send_log",
];

async function count(base: string, key: string, table: string) {
  try {
    const r = await fetch(`${base}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
    });
    if (!r.ok) return -1;
    return Number((r.headers.get("content-range") || "*/0").split("/")[1] || 0);
  } catch {
    return -1;
  }
}

async function users(base: string, key: string) {
  let total = 0;
  for (let page = 1; page < 60; page++) {
    const r = await fetch(`${base}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!r.ok) return -1;
    const j = await r.json();
    const list = j.users || [];
    total += list.length;
    if (list.length < 200) break;
  }
  return total;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

  if (!DST_URL || !DST_KEY) return json({ error: "external credentials missing" }, 400);

  const rows: Record<string, { here: number; external: number; diff: number }> = {};
  const missing: string[] = [];
  const behind: string[] = [];

  for (const t of TABLES) {
    const [here, external] = await Promise.all([count(SRC_URL, SRC_KEY, t), count(DST_URL, DST_KEY, t)]);
    rows[t] = { here, external, diff: external - here };
    if (external < 0) missing.push(t);
    else if (external < here) behind.push(t);
  }

  const [uHere, uExt] = await Promise.all([users(SRC_URL, SRC_KEY), users(DST_URL, DST_KEY)]);

  return json({
    checked_at: new Date().toISOString(),
    auth_users: { here: uHere, external: uExt },
    tables: rows,
    missing_on_external: missing,
    behind_on_external: behind,
    ready: missing.length === 0 && behind.length === 0 && uExt >= uHere,
  });
});
