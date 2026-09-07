// Daily, bounded organic-looking growth of view counts + keep-alive ping.
// Call once a day (cron). Growth is modest, tapers with age and stops at a cap.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CAP = 9000; // never inflate a single listing beyond this
const BATCH = 600; // rows touched per run per table

function bump(views: number, ageDays: number, boosted: boolean) {
  if (views >= CAP) return views;
  // Newer listings grow faster; growth tapers as the listing ages.
  const freshness = ageDays <= 3 ? 1.6 : ageDays <= 14 ? 1.15 : ageDays <= 60 ? 0.7 : 0.35;
  const base = 8 + Math.random() * 34; // 8 - 42 views/day baseline
  const growth = Math.round(base * freshness * (boosted ? 1.5 : 1));
  return Math.min(CAP, views + Math.max(3, growth));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = Date.now();
    const result: Record<string, number> = {};

    // ---- Ads ----------------------------------------------------------------
    const { data: ads, error: adsErr } = await sb
      .from("ads")
      .select("id, views_count, created_at, badge")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(BATCH);
    if (adsErr) throw adsErr;

    let adsUpdated = 0;
    for (const a of ads ?? []) {
      const ageDays = (now - new Date(a.created_at as string).getTime()) / 86_400_000;
      const next = bump(a.views_count ?? 0, ageDays, a.badge === "gold" || a.badge === "silver");
      if (next === (a.views_count ?? 0)) continue;
      const { error } = await sb.from("ads").update({ views_count: next }).eq("id", a.id);
      if (!error) adsUpdated++;
    }
    result.ads = adsUpdated;

    // ---- Directory profiles -------------------------------------------------
    const { data: profiles } = await sb
      .from("directory_profiles")
      .select("id, views_count, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(200);
    let profUpdated = 0;
    for (const p of profiles ?? []) {
      const ageDays = (now - new Date(p.created_at as string).getTime()) / 86_400_000;
      const next = bump(p.views_count ?? 0, ageDays, false);
      if (next === (p.views_count ?? 0)) continue;
      const { error } = await sb.from("directory_profiles").update({ views_count: next }).eq("id", p.id);
      if (!error) profUpdated++;
    }
    result.directory_profiles = profUpdated;

    // ---- Blog posts ---------------------------------------------------------
    const { data: posts } = await sb
      .from("blog_posts")
      .select("id, views_count, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120);
    let postUpdated = 0;
    for (const b of posts ?? []) {
      const ageDays = (now - new Date(b.created_at as string).getTime()) / 86_400_000;
      const next = bump(b.views_count ?? 0, ageDays, false);
      if (next === (b.views_count ?? 0)) continue;
      const { error } = await sb.from("blog_posts").update({ views_count: next }).eq("id", b.id);
      if (!error) postUpdated++;
    }
    result.blog_posts = postUpdated;

    return json({ ok: true, updated: result, ran_at: new Date().toISOString() });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
