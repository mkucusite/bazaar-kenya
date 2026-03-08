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

const callGemini = async (prompt: string, maxOutputTokens: number) => {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    if (response.status === 429) {
      throw new Error("Gemini rate limit reached. Please retry shortly.");
    }
    throw new Error(`Gemini request failed [${response.status}]: ${errorBody}`);
  }

  const payload = await response.json();
  const text = readGeminiText(payload);
  if (!text) throw new Error("Gemini returned an empty response");
  return parseJsonFromText(text);
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
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return json({ error: "Forbidden: admin access required" }, 403);
    }

    const body = await req.json();
    const mode = body?.mode;

    if (mode === "page") {
      const siteUrl = normalizeString(body?.site_url, "https://kenyaadverts.co.ke");
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
        meta_title: normalizeString(ai?.meta_title).slice(0, 60),
        meta_description: normalizeString(ai?.meta_description).slice(0, 155),
        keywords: normalizeString(ai?.keywords),
        canonical_url: normalizeString(ai?.canonical_url, canonicalFallback),
        og_image: normalizeString(ai?.og_image, `${siteUrl.replace(/\/$/, "")}/og-image.png`),
        robots: normalizeString(ai?.robots, "index, follow"),
      });
    }

    if (mode === "product") {
      const siteUrl = normalizeString(body?.site_url, "https://kenyaadverts.co.ke").replace(/\/$/, "");
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
  "meta_title": "max 70 chars",
  "meta_description": "max 200 chars",
  "keywords": "comma separated, 6-10 items relevant to Kenyan buyers",
  "robots": "one of: index, follow | noindex, follow | noindex, nofollow"
}`;

      const ai = await callGemini(prompt, 500);
      const optimizedTitle = normalizeString(ai?.meta_title || title).slice(0, 70);
      const canonicalSlug = adSlug || slugify(optimizedTitle);
      const canonicalUrl = `${siteUrl}/ads/${canonicalSlug}`;

      return json({
        meta_title: optimizedTitle,
        meta_description: normalizeString(ai?.meta_description || description).slice(0, 200),
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
