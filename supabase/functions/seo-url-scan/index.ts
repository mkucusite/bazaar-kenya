// Indexing dashboard backend: scans URLs via Google Search Console URL Inspection API
// and pings the Indexing API. Uses smart cache logic to stay under the 2000/day GSC quota.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.com";
const GSC_DAILY_LIMIT = 2000;
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

async function getUsage() {
  const { data } = await supabase.from("seo_api_usage").select("*").eq("day", today()).maybeSingle();
  return data ?? { day: today(), gsc_calls: 0, ping_calls: 0 };
}
async function bumpUsage(field: "gsc_calls" | "ping_calls", n = 1) {
  const u = await getUsage();
  const next = { ...u, [field]: (u as any)[field] + n };
  await supabase.from("seo_api_usage").upsert(next, { onConflict: "day" });
}

// Discover URLs from all public content tables + static routes
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
  return [...urls];
}

// Decide whether a URL should be re-checked today
function shouldCheck(row: any): boolean {
  if (!row) return true;
  const last = row.last_checked ? new Date(row.last_checked).getTime() : 0;
  const ageHrs = (Date.now() - last) / 3_600_000;
  if (ageHrs < 24) return false; // never 2x same day
  if (row.status === "indexed") return ageHrs >= 24 * 7; // weekly
  return ageHrs >= 24; // daily for not-indexed
}

async function inspectUrl(url: string): Promise<{ status: string; raw: any }> {
  const lovKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovKey || !gscKey) return { status: "error", raw: { error: "GSC connector not configured" } };
  const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL + "/" }),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) return { status: "error", raw };
  const verdict = raw?.inspectionResult?.indexStatusResult?.verdict;
  const coverageState = raw?.inspectionResult?.indexStatusResult?.coverageState || "";
  let status = "pending";
  if (verdict === "PASS" || /Submitted and indexed|Indexed/i.test(coverageState)) status = "indexed";
  else if (verdict === "FAIL" || verdict === "NEUTRAL" || /not indexed|Discovered|Crawled/i.test(coverageState)) status = "not_indexed";
  return { status, raw };
}

// Google Indexing API ping — requires a Google Service Account JSON in secrets
async function pingIndexing(url: string): Promise<{ ok: boolean; message: string }> {
  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!saJson) {
    // Fallback: ping the sitemap so Google rediscovers
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITE_URL + "/sitemap.xml")}`);
      return { ok: true, message: "Sitemap pinged (add GOOGLE_SERVICE_ACCOUNT_JSON for direct Indexing API)" };
    } catch (e) {
      return { ok: false, message: "Sitemap ping failed" };
    }
  }
  try {
    const sa = JSON.parse(saJson);
    const token = await getServiceAccountToken(sa, "https://www.googleapis.com/auth/indexing");
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, message: "Indexing API: URL_UPDATED submitted" };
  } catch (e: any) {
    return { ok: false, message: e.message };
  }
}

async function getServiceAccountToken(sa: any, scope: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
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
  return j.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "scan";

    if (mode === "ping" && body.url) {
      const { data: row } = await supabase.from("seo_url_index").select("*").eq("url", body.url).maybeSingle();
      if (row?.last_pinged && Date.now() - new Date(row.last_pinged).getTime() < 24 * 3_600_000) {
        return new Response(JSON.stringify({ ok: false, message: "Already pinged within 24h" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const result = await pingIndexing(body.url);
      await bumpUsage("ping_calls");
      await supabase.from("seo_url_index").upsert({
        url: body.url,
        last_pinged: nowIso(),
        ping_count: (row?.ping_count ?? 0) + 1,
        status: row?.status ?? "pending",
        updated_at: nowIso(),
      }, { onConflict: "url" });
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "ping_unindexed") {
      const { data: list } = await supabase.from("seo_url_index").select("*").eq("status", "not_indexed").limit(200);
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

    // SCAN mode
    const urls = await discoverUrls();
    const { data: existing } = await supabase.from("seo_url_index").select("*");
    const byUrl = new Map((existing || []).map((r: any) => [r.url, r]));
    let usage = await getUsage();
    let checked = 0, indexed = 0, notIndexed = 0, skipped = 0;

    // Seed rows for any new URLs
    const newRows = urls.filter((u) => !byUrl.has(u)).map((u) => ({ url: u, status: "pending", updated_at: nowIso() }));
    if (newRows.length) await supabase.from("seo_url_index").upsert(newRows, { onConflict: "url" });

    for (const url of urls) {
      if (usage.gsc_calls >= GSC_DAILY_LIMIT) break;
      const row = byUrl.get(url) || { url, status: "pending", last_checked: null };
      if (!shouldCheck(row)) { skipped++; continue; }
      const { status, raw } = await inspectUrl(url);
      checked++;
      usage = { ...usage, gsc_calls: usage.gsc_calls + 1 };
      if (status === "indexed") indexed++;
      else if (status === "not_indexed") notIndexed++;
      await supabase.from("seo_url_index").upsert({
        url, status, last_checked: nowIso(), inspection_result: raw, updated_at: nowIso(),
      }, { onConflict: "url" });
    }
    await supabase.from("seo_api_usage").upsert({ day: today(), gsc_calls: usage.gsc_calls, ping_calls: usage.ping_calls }, { onConflict: "day" });

    return new Response(JSON.stringify({ checked, indexed, not_indexed: notIndexed, skipped, total: urls.length, quota_used: usage.gsc_calls, quota_limit: GSC_DAILY_LIMIT }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
