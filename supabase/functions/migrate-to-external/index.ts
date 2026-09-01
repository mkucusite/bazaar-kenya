// One-way data migration: Lovable Cloud (source) -> external Supabase project (target)
// Resumable: caller drives table + offset. Guarded by MIGRATION_TOKEN.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-token",
};

const SRC_URL = Deno.env.get("SUPABASE_URL")!;
const SRC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DST_URL = (Deno.env.get("EXTERNAL_SUPABASE_URL") || "").replace(/\/$/, "");
const DST_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("MIGRATION_TOKEN")!;

// Dependency-ordered list of tables to copy.
const TABLES = [
  "categories",
  "subcategories",
  "profiles",
  "user_roles",
  "political_parties",
  "site_pages",
  "site_config",
  "admin_settings",
  "seo_settings",
  "seo_url_index",
  "seo_api_usage",
  "blog_posts",
  "digital_products",
  "directory_profiles",
  "business_profiles",
  "credits",
  "ads",
  "payments",
  "credit_purchases",
  "banner_campaigns",
  "banner_votes",
  "banner_likes",
  "banner_reports",
  "events",
  "event_rsvps",
  "event_reports",
  "ad_reports",
  "reviews",
  "favourites",
  "conversations",
  "messages",
  "notifications",
  "notification_preferences",
  "privacy_settings",
  "alerts",
  "alert_requests",
  "advertiser_requests",
  "category_suggestions",
  "blog_comments",
  "politician_edit_requests",
  "ip_blocks",
  "login_logs",
  "email_send_log",
  "email_send_state",
  "email_unsubscribe_tokens",
  "suppressed_emails",
];

async function srcCount(table: string) {
  const r = await fetch(`${SRC_URL}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  return Number((r.headers.get("content-range") || "*/0").split("/")[1] || 0);
}

async function dstCount(table: string) {
  const r = await fetch(`${DST_URL}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: DST_KEY, Authorization: `Bearer ${DST_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  if (!r.ok) return -1; // table missing on target
  return Number((r.headers.get("content-range") || "*/0").split("/")[1] || 0);
}

async function copyUsers() {
  // Copy auth users (ids preserved) so FKs to auth.users resolve on the target.
  let page = 1;
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  while (page < 50) {
    const r = await fetch(`${SRC_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}` },
    });
    const j = await r.json();
    const users = j.users || [];
    if (!users.length) break;
    for (const u of users) {
      const body = {
        id: u.id,
        email: u.email,
        phone: u.phone || undefined,
        email_confirm: !!u.email_confirmed_at,
        phone_confirm: !!u.phone_confirmed_at,
        user_metadata: u.user_metadata || {},
        app_metadata: u.app_metadata || {},
      };
      const cr = await fetch(`${DST_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: { apikey: DST_KEY, Authorization: `Bearer ${DST_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (cr.ok) created++;
      else {
        const t = await cr.text();
        if (/already|exists|duplicate/i.test(t)) skipped++;
        else if (errors.length < 5) errors.push(t.slice(0, 200));
      }
    }
    page++;
  }
  return { created, skipped, errors };
}

async function copyTable(table: string, offset: number, chunk: number, maxRows: number) {
  let copied = 0;
  let cursor = offset;
  const started = Date.now();
  while (copied < maxRows && Date.now() - started < 100_000) {
    const r = await fetch(`${SRC_URL}/rest/v1/${table}?select=*&order=created_at.asc`, {
      headers: {
        apikey: SRC_KEY,
        Authorization: `Bearer ${SRC_KEY}`,
        Range: `${cursor}-${cursor + chunk - 1}`,
      },
    });
    let rows: any[];
    if (!r.ok) {
      // table may not have created_at — retry unordered
      const r2 = await fetch(`${SRC_URL}/rest/v1/${table}?select=*`, {
        headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}`, Range: `${cursor}-${cursor + chunk - 1}` },
      });
      if (!r2.ok) return { ok: false, error: (await r2.text()).slice(0, 300), cursor, copied };
      rows = await r2.json();
    } else {
      rows = await r.json();
    }
    if (!rows.length) return { ok: true, done: true, cursor, copied };

    const ins = await fetch(`${DST_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: DST_KEY,
        Authorization: `Bearer ${DST_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify(rows),
    });
    if (!ins.ok) {
      return { ok: false, error: (await ins.text()).slice(0, 400), cursor, copied };
    }
    cursor += rows.length;
    copied += rows.length;
    if (rows.length < chunk) return { ok: true, done: true, cursor, copied };
  }
  return { ok: true, done: false, cursor, copied };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const token = req.headers.get("x-migration-token") || url.searchParams.get("token");
  if (!TOKEN || token !== TOKEN) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }
  if (!DST_URL || !DST_KEY) {
    return new Response(JSON.stringify({ error: "external credentials missing" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const action = url.searchParams.get("action") || "status";
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    if (action === "status") {
      const out: Record<string, { source: number; target: number }> = {};
      for (const t of TABLES) out[t] = { source: await srcCount(t), target: await dstCount(t) };
      return json({ target: DST_URL, tables: out });
    }
    if (action === "users") return json(await copyUsers());
    if (action === "copy") {
      const table = url.searchParams.get("table") || "";
      if (!TABLES.includes(table)) return json({ error: "unknown table" }, 400);
      const offset = Number(url.searchParams.get("offset") || 0);
      const chunk = Math.min(Number(url.searchParams.get("chunk") || 500), 1000);
      const maxRows = Math.min(Number(url.searchParams.get("max") || 5000), 50000);
      return json({ table, ...(await copyTable(table, offset, chunk, maxRows)) });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
