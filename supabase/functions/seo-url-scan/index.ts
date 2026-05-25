// Indexing dashboard backend
// - Status checks: Google Indexing API metadata endpoint via service account JSON
// - Pings: Google Indexing API publish endpoint via service account JSON
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.com";
const SITE_PROPERTY = SITE_URL + "/";
const GSC_DAILY_LIMIT = 2000;
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

// Force https:// prefix on every URL before saving, checking, or pinging Google.
function normalize(u: string): string {
  let s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("//")) s = `https:${s}`;
  if (!/^https?:\/\//i.test(s)) s = `https://${s.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(s);
    parsed.protocol = "https:";
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return `https://${s.replace(/^https?:\/\//i, "").replace(/^\/+/, "")}`;
  }
}

async function getUsage() {
  const { data } = await supabase.from("seo_api_usage").select("*").eq("day", today()).maybeSingle();
  return data ?? { day: today(), gsc_calls: 0, ping_calls: 0 };
}
async function bumpUsage(field: "gsc_calls" | "ping_calls", n = 1) {
  const u = await getUsage();
  const next = { ...u, [field]: ((u as any)[field] || 0) + n };
  await supabase.from("seo_api_usage").upsert(next, { onConflict: "day" });
}

async function discoverUrls(): Promise<string[]> {
  const urls = new Set<string>([
    `${SITE_URL}/`,
    `${SITE_URL}/search`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/events`,
    `${SITE_URL}/banners`,
    `${SITE_URL}/politics`,
    `${SITE_URL}/advertise`,
    `${SITE_URL}/safety-tips`,
    `${SITE_URL}/about`,
    `${SITE_URL}/faqs`,
  ]);
  const [ads, blogs, banners, events] = await Promise.all([
    supabase.from("ads").select("slug").eq("status", "active").limit(2000),
    supabase.from("blog_posts").select("slug").eq("is_published", true).limit(500),
    supabase.from("banner_campaigns").select("slug").eq("status", "active").limit(500),
    supabase.from("events").select("slug").eq("is_published", true).limit(500),
  ]);
  ads.data?.forEach((r: any) => r.slug && urls.add(`${SITE_URL}/ad/${r.slug}`));
  blogs.data?.forEach((r: any) => r.slug && urls.add(`${SITE_URL}/blog/${r.slug}`));
  banners.data?.forEach((r: any) => r.slug && urls.add(`${SITE_URL}/banners/${r.slug}`));
  events.data?.forEach((r: any) => r.slug && urls.add(`${SITE_URL}/events/${r.slug}`));
  return [...urls].map(normalize);
}

function shouldCheck(row: any): boolean {
  if (!row) return true;
  if (!row.last_checked) return true; // never checked → always scan
  const ageHrs = (Date.now() - new Date(row.last_checked).getTime()) / 3_600_000;
  if (row.status === "indexed") return ageHrs >= 24 * 7;
  if (row.status === "error") return true; // manual scans should clear old API/URL errors immediately
  if (ageHrs < 12) return false;
  return ageHrs >= 24;
}

// ---- Service account token (for Indexing API pings) ----
let cachedToken: { token: string; exp: number } | null = null;
async function getSaToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  const sa = JSON.parse(saJson);
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: sa.client_email, scope: "https://www.googleapis.com/auth/indexing", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const enc = (o: any) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const input = `${enc(header)}.${enc(claim)}`;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input)));
  const jwt = `${input}.${btoa(String.fromCharCode(...sig)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || "token exchange failed");
  cachedToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function inspectWithGscConnector(target: string): Promise<{ status: string; raw: any }> {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovKey || !gscKey) return { status: "error", raw: { error: "Google Search Console connector not configured", normalizedUrl: target } };

  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl: target, siteUrl: SITE_PROPERTY }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "error", raw: { ...raw, normalizedUrl: target } };
  const verdict = raw?.inspectionResult?.indexStatusResult?.verdict;
  const coverageState = raw?.inspectionResult?.indexStatusResult?.coverageState || "";
  if (verdict === "PASS" || /Submitted and indexed|Indexed/i.test(coverageState)) return { status: "indexed", raw: { ...raw, normalizedUrl: target } };
  if (verdict === "FAIL" || verdict === "NEUTRAL" || /not indexed|Discovered|Crawled|Excluded/i.test(coverageState)) return { status: "not_indexed", raw: { ...raw, normalizedUrl: target } };
  return { status: "not_indexed", raw: { ...raw, normalizedUrl: target } };
}

async function inspectWithIndexingMetadata(targetUrl: string): Promise<{ status: string; raw: any }> {
  const target = normalize(targetUrl);
  if (!target) return { status: "error", raw: { error: "Missing URL" } };
  try {
    const token = await getSaToken();
    const res = await fetch(`https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(target)}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const raw = await res.json().catch(() => ({}));
    if (res.status === 404) return { status: "not_indexed", raw: { ...raw, normalizedUrl: target } };
    if (!res.ok) return { status: "error", raw: { ...raw, normalizedUrl: target } };

    const meta = raw?.urlNotificationMetadata || raw;
    const latestUpdate = meta?.latestUpdate?.notifyTime ? Date.parse(meta.latestUpdate.notifyTime) : 0;
    const latestRemove = meta?.latestRemove?.notifyTime ? Date.parse(meta.latestRemove.notifyTime) : 0;
    const status = latestUpdate && latestUpdate >= latestRemove ? "indexed" : "not_indexed";
    return { status, raw: { ...raw, normalizedUrl: target } };
  } catch (e: any) {
    return { status: "error", raw: { error: e.message, normalizedUrl: target } };
  }
}

// ---- Status check: use the verified Search Console connector; Indexing metadata requires the same ownership and fails for this service account. ----
async function inspectUrl(url: string): Promise<{ status: string; raw: any }> {
  const target = normalize(url);
  if (!target) return { status: "error", raw: { error: "Missing URL" } };
  return await inspectWithGscConnector(target);
}

// ---- Ping via Google Indexing API (service account) ----
async function pingIndexing(url: string): Promise<{ ok: boolean; message: string }> {
  const target = normalize(url);
  try {
    const token = await getSaToken();
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url: target, type: "URL_UPDATED" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, message: "✅ Submitted to Google Indexing API successfully" };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "scan";

    // ---- One-time backfill: normalize any non-https URLs in the table ----
    if (mode === "scan") {
      const { data: badRows } = await supabase
        .from("seo_url_index")
        .select("id, url")
        .not("url", "ilike", "https://%")
        .limit(1000);
      for (const r of badRows || []) {
        const fixed = normalize((r as any).url);
        // Delete the bad row if a clean one already exists, else update
        const { data: dup } = await supabase.from("seo_url_index").select("id").eq("url", fixed).maybeSingle();
        if (dup) {
          await supabase.from("seo_url_index").delete().eq("id", (r as any).id);
        } else {
          await supabase.from("seo_url_index").update({ url: fixed, status: "pending", last_checked: null, updated_at: nowIso() }).eq("id", (r as any).id);
        }
      }
    }

    if (mode === "ping" && body.url) {
      const targetUrl = normalize(body.url);
      const { data: row } = await supabase.from("seo_url_index").select("*").eq("url", targetUrl).maybeSingle();
      if (row?.last_pinged && Date.now() - new Date(row.last_pinged).getTime() < 24 * 3_600_000) {
        return new Response(JSON.stringify({ ok: false, message: "Already pinged within 24h" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const result = await pingIndexing(targetUrl);
      if (result.ok) {
        await bumpUsage("ping_calls");
        await supabase.from("seo_url_index").upsert({
          url: targetUrl,
          last_pinged: nowIso(),
          ping_count: (row?.ping_count ?? 0) + 1,
          status: row?.status === "indexed" ? "indexed" : "pending",
          updated_at: nowIso(),
        }, { onConflict: "url" });
      }
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "ping_unindexed") {
      const { data: list } = await supabase.from("seo_url_index").select("*").in("status", ["not_indexed", "pending", "error"]).limit(200);
      let pinged = 0, skipped = 0;
      for (const r of list || []) {
        if (r.last_pinged && Date.now() - new Date(r.last_pinged).getTime() < 24 * 3_600_000) { skipped++; continue; }
        const res = await pingIndexing(r.url);
        if (res.ok) {
          pinged++;
          await bumpUsage("ping_calls");
          await supabase.from("seo_url_index").update({ last_pinged: nowIso(), ping_count: (r.ping_count ?? 0) + 1, updated_at: nowIso() }).eq("id", r.id);
        } else skipped++;
      }
      return new Response(JSON.stringify({ pinged, skipped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- SCAN ----
    const urls = await discoverUrls();
    const { data: existing } = await supabase.from("seo_url_index").select("*");
    const byUrl = new Map((existing || []).map((r: any) => [r.url, r]));
    let usage = await getUsage();
    let checked = 0, indexed = 0, notIndexed = 0, skipped = 0, errored = 0;

    const newRows = urls.filter((u) => !byUrl.has(u)).map((u) => ({ url: u, status: "pending", updated_at: nowIso() }));
    if (newRows.length) await supabase.from("seo_url_index").upsert(newRows, { onConflict: "url" });

    // Prioritize: never-checked first, then error, then oldest
    const sorted = [...urls].sort((a, b) => {
      const ra = byUrl.get(a), rb = byUrl.get(b);
      const pa = !ra?.last_checked ? 0 : ra.status === "error" ? 1 : 2;
      const pb = !rb?.last_checked ? 0 : rb.status === "error" ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return (ra?.last_checked || "") < (rb?.last_checked || "") ? -1 : 1;
    });

    for (const url of sorted) {
      if (usage.gsc_calls >= GSC_DAILY_LIMIT) break;
      const row = byUrl.get(url);
      if (!shouldCheck(row)) { skipped++; continue; }
      const { status, raw } = await inspectUrl(url);
      checked++;
      usage = { ...usage, gsc_calls: usage.gsc_calls + 1 };
      if (status === "indexed") indexed++;
      else if (status === "not_indexed") notIndexed++;
      else if (status === "error") errored++;
      await supabase.from("seo_url_index").upsert({
        url, status, last_checked: nowIso(), inspection_result: raw, updated_at: nowIso(),
      }, { onConflict: "url" });
    }
    await supabase.from("seo_api_usage").upsert({ day: today(), gsc_calls: usage.gsc_calls, ping_calls: usage.ping_calls }, { onConflict: "day" });

    return new Response(JSON.stringify({ checked, indexed, not_indexed: notIndexed, errored, skipped, total: urls.length, quota_used: usage.gsc_calls, quota_limit: GSC_DAILY_LIMIT }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
