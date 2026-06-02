import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "listing";

const readGeminiText = (payload: any) =>
  payload?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") || "";

const parseJsonFromText = (text: string) => {
  const direct = text.trim();
  if (direct.startsWith("{") && direct.endsWith("}")) {
    return JSON.parse(direct);
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("AI response did not return valid JSON");
};

const normalizeString = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback;
  return value.trim();
};

const stripBrandSuffix = (value: string) => {
  let out = (value || "").replace(/\s+/g, " ").trim();
  const patterns = [
    /\s*[|—\-–·•:]\s*Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i,
    /\s*[|—\-–·•:]\s*KenyaAdvert(?:s)?(?:\.com)?\s*$/i,
    /\s+on\s+Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i,
  ];
  let guard = 0;
  while (guard++ < 6) {
    const next = patterns.reduce((acc, pattern) => acc.replace(pattern, "").trim(), out);
    if (next === out) break;
    out = next;
  }
  return out;
};

const clampMeta = (value: string, max: number) => {
  const clean = stripBrandSuffix(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 35 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:|—\-]+$/, "")}…`;
};

const getGeminiKeys = (): string[] => {
  const keys: string[] = [];
  const primary = Deno.env.get("GEMINI_API_KEY");
  if (primary) keys.push(primary);
  for (let i = 2; i <= 7; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
};

const callGemini = async (prompt: string, maxOutputTokens: number) => {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxOutputTokens,
        response_format: { type: "json_object" },
      }),
    });
    if (response.ok) {
      const payload = await response.json();
      return parseJsonFromText(payload?.choices?.[0]?.message?.content || "");
    }
    if (response.status !== 429 && response.status !== 402) {
      console.error("AI gateway SEO error:", response.status, await response.text());
    }
  }

  const keys = getGeminiKeys();
  if (keys.length === 0) throw new Error("GEMINI_API_KEY is not configured");

  let lastError: Error | null = null;
  for (const key of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 429 || response.status === 403) {
          lastError = new Error(`Gemini key exhausted [${response.status}]: ${errorBody}`);
          continue;
        }
        throw new Error(`Gemini request failed [${response.status}]: ${errorBody}`);
      }

      const payload = await response.json();
      const text = readGeminiText(payload);
      if (!text) throw new Error("Gemini returned an empty response");
      return parseJsonFromText(text);
    } catch (e) {
      lastError = e as Error;
      continue;
    }
  }
  throw lastError ?? new Error("All Gemini keys failed");
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Backend credentials are not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;
    const body = await req.json();
    const mode = body?.mode;

    if (mode === "product_autosave") {
      const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!SERVICE_KEY) return json({ error: "Service credentials are not configured" }, 500);

      const siteUrl = normalizeString(body?.site_url, "https://kenyaadverts.com").replace(/\/$/, "");
      const adId = normalizeString(body?.ad_id);
      const adSlug = normalizeString(body?.ad_slug);
      const title = normalizeString(body?.title);
      const description = normalizeString(body?.description);
      const county = normalizeString(body?.county);
      const imageUrl = normalizeString(body?.image_url, `${siteUrl}/og-image.png`);
      const price = body?.price;
      if (!adId || !title) return json({ error: "ad_id and title are required" }, 400);

      const ai = await callGemini(`Generate SEO JSON for this Kenyan classifieds listing. No brand suffix in title.
Title: ${title}
Description: ${description}
County: ${county}
Price: ${price ?? "Not provided"}
Return strict JSON: {"meta_title":"SEO title, max 58 chars, no brand name","meta_description":"unique buyer-focused description, 120-155 chars","keywords":"comma separated 6-10 Kenyan buyer keywords","robots":"index, follow"}`, 700);

      const metaTitle = clampMeta(normalizeString(ai?.meta_title || title), 58);
      const metaDescription = clampMeta(normalizeString(ai?.meta_description || description || title), 155);
      const canonicalUrl = `${siteUrl}/ads/${adSlug || slugify(title)}`;
      const service = createClient(SUPABASE_URL, SERVICE_KEY);
      const now = new Date().toISOString();
      const rows = [`/ads/${adId}`, `/ads/${adSlug || slugify(title)}`].filter((v, i, arr) => v && arr.indexOf(v) === i).map((pageSlug) => ({
        page_slug: pageSlug,
        page_name: `Product: ${metaTitle}`,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords: normalizeString(ai?.keywords),
        canonical_url: canonicalUrl,
        og_image: imageUrl,
        robots: normalizeString(ai?.robots, "index, follow"),
        updated_by: userId,
        updated_at: now,
      }));
      await service.from("seo_settings").upsert(rows, { onConflict: "page_slug" });

      return json({ meta_title: metaTitle, meta_description: metaDescription, canonical_url: canonicalUrl });
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return json({ error: "Forbidden: admin access required" }, 403);
    }

    if (mode === "page") {
      const siteUrl = normalizeString(body?.site_url, "https://kenyaadverts.com");
      const pageName = normalizeString(body?.page_name, "Page");
      const pageSlug = normalizeString(body?.page_slug, "/");

      const prompt = `You are an expert SEO strategist for Kenya classifieds.
Generate SEO fields for this page.

Page name: ${pageName}
Page path: ${pageSlug}
Site URL: ${siteUrl}
Current meta title: ${normalizeString(body?.meta_title, "")}
Current meta description: ${normalizeString(body?.meta_description, "")}
Current keywords: ${normalizeString(body?.keywords, "")}
Current canonical URL: ${normalizeString(body?.canonical_url, "")}
Current robots: ${normalizeString(body?.robots, "")}
Current OG image URL: ${normalizeString(body?.og_image, "")}

Respond ONLY with strict JSON:
{
  "meta_title": "max 60 chars",
  "meta_description": "max 155 chars",
  "keywords": "comma separated, 6-10 items",
  "canonical_url": "absolute https URL",
  "og_image": "absolute https image URL (prefer ${siteUrl}/og-image.png if no better image)",
  "robots": "one of: index, follow | noindex, follow | noindex, nofollow"
}`;

      const ai = await callGemini(prompt, 500);
      const canonicalFallback = `${siteUrl.replace(/\/$/, "")}${pageSlug.startsWith("/") ? pageSlug : `/${pageSlug}`}`;

      return json({
        meta_title: clampMeta(normalizeString(ai?.meta_title), 58),
        meta_description: clampMeta(normalizeString(ai?.meta_description), 155),
        keywords: normalizeString(ai?.keywords),
        canonical_url: normalizeString(ai?.canonical_url, canonicalFallback),
        og_image: normalizeString(ai?.og_image, `${siteUrl.replace(/\/$/, "")}/og-image.png`),
        robots: normalizeString(ai?.robots, "index, follow"),
      });
    }

    if (mode === "product") {
      const siteUrl = normalizeString(body?.site_url, "https://kenyaadverts.com").replace(/\/$/, "");
      const adSlug = normalizeString(body?.ad_slug);
      const title = normalizeString(body?.title);
      const description = normalizeString(body?.description);
      const county = normalizeString(body?.county);
      const imageUrl = normalizeString(body?.image_url, `${siteUrl}/og-image.png`);
      const price = body?.price;

      if (!title) return json({ error: "title is required" }, 400);

      const prompt = `You are an expert product SEO strategist for a Kenyan classifieds marketplace.
Optimize this listing for Google search and social sharing.

Title: ${title}
Description: ${description}
County: ${county}
Price: ${price ?? "Not provided"}
Site URL: ${siteUrl}

Respond ONLY with strict JSON:
{
  "meta_title": "SEO title, max 58 chars, no brand name",
  "meta_description": "unique buyer-focused description, 120-155 chars",
  "keywords": "comma separated, 6-10 items relevant to Kenyan buyers",
  "robots": "one of: index, follow | noindex, follow | noindex, nofollow"
}`;

      const ai = await callGemini(prompt, 500);
      const optimizedTitle = clampMeta(normalizeString(ai?.meta_title || title), 58);
      const canonicalSlug = adSlug || slugify(optimizedTitle);
      const canonicalUrl = `${siteUrl}/ads/${canonicalSlug}`;

      return json({
        meta_title: optimizedTitle,
        meta_description: clampMeta(normalizeString(ai?.meta_description || description), 155),
        keywords: normalizeString(ai?.keywords),
        canonical_url: canonicalUrl,
        og_image: imageUrl,
        robots: normalizeString(ai?.robots, "index, follow"),
      });
    }

    return json({ error: "Invalid mode. Use 'page' or 'product'." }, 400);
  } catch (error) {
    console.error("seo-gemini error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
