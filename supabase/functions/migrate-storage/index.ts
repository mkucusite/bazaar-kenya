// Copies storage objects from Lovable Cloud buckets to the external Supabase project.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-token",
};

const SRC_URL = Deno.env.get("SUPABASE_URL")!;
const SRC_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DST_URL = (Deno.env.get("EXTERNAL_SUPABASE_URL") || "").replace(/\/$/, "");
const DST_KEY = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN = Deno.env.get("DDL_TOKEN") || Deno.env.get("MIGRATION_TOKEN")!;

const BUCKETS = ["ad-images", "banners", "events", "listing-images", "blog-images"];

async function ensureBucket(name: string) {
  const r = await fetch(`${DST_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { apikey: DST_KEY, Authorization: `Bearer ${DST_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: name, name, public: true }),
  });
  return r.ok ? "created" : (await r.text()).slice(0, 120);
}

async function listAll(bucket: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${SRC_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!r.ok) break;
    const items = await r.json();
    if (!Array.isArray(items) || !items.length) break;
    for (const it of items) {
      const path = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await listAll(bucket, path)));
      else out.push(path);
    }
    if (items.length < 1000) break;
    offset += items.length;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

  const url = new URL(req.url);
  const token = req.headers.get("x-migration-token") || url.searchParams.get("token");
  if (!TOKEN || token !== TOKEN) return json({ error: "unauthorized" }, 401);

  const bucket = url.searchParams.get("bucket");
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Math.min(Number(url.searchParams.get("limit") || 40), 100);

  if (!bucket) {
    const created: Record<string, string> = {};
    for (const b of BUCKETS) created[b] = await ensureBucket(b);
    return json({ buckets: created });
  }
  if (!BUCKETS.includes(bucket)) return json({ error: "unknown bucket" }, 400);

  await ensureBucket(bucket);
  const all = await listAll(bucket);
  const slice = all.slice(offset, offset + limit);
  let copied = 0;
  const errors: string[] = [];
  for (const path of slice) {
    const src = await fetch(`${SRC_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      headers: { apikey: SRC_KEY, Authorization: `Bearer ${SRC_KEY}` },
    });
    if (!src.ok) { if (errors.length < 5) errors.push(`get ${path}`); continue; }
    const body = new Uint8Array(await src.arrayBuffer());
    const up = await fetch(`${DST_URL}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      method: "POST",
      headers: {
        apikey: DST_KEY,
        Authorization: `Bearer ${DST_KEY}`,
        "Content-Type": src.headers.get("content-type") || "application/octet-stream",
        "x-upsert": "true",
      },
      body,
    });
    if (up.ok) copied++;
    else if (errors.length < 5) errors.push(`put ${path}: ${(await up.text()).slice(0, 100)}`);
  }
  return json({ bucket, total: all.length, offset, copied, done: offset + limit >= all.length, errors });
});
