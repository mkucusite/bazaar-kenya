// Tops up the external project with rows added here since the last copy.
// Duplicate-safe (ignore-duplicates), resumable via ?table=&offset=.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SRC_URL = Deno.env.get("SUPABASE_URL")!;
const SRC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DST_URL = (Deno.env.get("EXTERNAL_SUPABASE_URL") || "").replace(/\/$/, "");
const DST_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY") || "";

const ALLOWED = [
  "profiles", "admin_settings", "seo_settings", "seo_url_index", "directory_profiles",
  "ads", "payments", "banner_campaigns", "ad_reports", "events", "digital_products",
  "political_parties", "blog_posts", "reviews", "messages", "conversations",
];

async function copyUsers() {
  let created = 0, skipped = 0;
  const errors: string[] = [];
  for (let page = 1; page < 60; page++) {
    const r = await fetch(`${SRC_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}` },
    });
    if (!r.ok) break;
    const list = (await r.json()).users || [];
    if (!list.length) break;
    for (const u of list) {
      const cr = await fetch(`${DST_URL}/auth/v1/admin/users`, {
        method: "POST",
        headers: { apikey: DST_KEY, Authorization: `Bearer ${DST_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          phone: u.phone || undefined,
          email_confirm: !!u.email_confirmed_at,
          phone_confirm: !!u.phone_confirmed_at,
          user_metadata: u.user_metadata || {},
          app_metadata: u.app_metadata || {},
        }),
      });
      if (cr.ok) created++;
      else {
        const t = await cr.text();
        if (/already|exists|duplicate/i.test(t)) skipped++;
        else if (errors.length < 5) errors.push(t.slice(0, 160));
      }
    }
    if (list.length < 200) break;
  }
  return { created, skipped, errors };
}

async function copyTable(table: string, offset: number, chunk: number) {
  let cursor = offset, copied = 0;
  const started = Date.now();
  while (Date.now() - started < 110_000) {
    let rows: any[] | null = null;
    for (const order of ["&order=created_at.asc", ""]) {
      const r = await fetch(`${SRC_URL}/rest/v1/${table}?select=*${order}`, {
        headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}`, Range: `${cursor}-${cursor + chunk - 1}` },
      });
      if (r.ok) { rows = await r.json(); break; }
    }
    if (!rows) return { ok: false, error: "source read failed", cursor, copied };
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
    if (!ins.ok) return { ok: false, error: (await ins.text()).slice(0, 300), cursor, copied };

    cursor += rows.length;
    copied += rows.length;
    if (rows.length < chunk) return { ok: true, done: true, cursor, copied };
  }
  return { ok: true, done: false, cursor, copied };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
  if (!DST_URL || !DST_KEY) return json({ error: "external credentials missing" }, 400);

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "table";
  if (action === "users") return json(await copyUsers());

  const table = url.searchParams.get("table") || "";
  if (!ALLOWED.includes(table)) return json({ error: "table not allowed" }, 400);
  const offset = Number(url.searchParams.get("offset") || 0);
  const chunk = Math.min(Number(url.searchParams.get("chunk") || 500), 1000);
  return json({ table, ...(await copyTable(table, offset, chunk)) });
});
