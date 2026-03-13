import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImagePayload = { bytes: Uint8Array; contentType: string; extension: string };

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function fetchImageByQuery(query: string): Promise<ImagePayload> {
  const candidates = [
    `https://source.unsplash.com/1200x675/?${encodeURIComponent(`${query},kenya`)}`,
    `https://source.unsplash.com/1200x675/?${encodeURIComponent(query)}`,
    "https://www.kenyaadverts.co.ke/og-image.png",
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length > 0) {
        return { bytes, contentType, extension: extensionFromContentType(contentType) };
      }
    } catch {
      // Try next candidate
    }
  }

  throw new Error("Unable to fetch blog image");
}

async function uploadToActiveProvider(
  supabase: ReturnType<typeof createClient>,
  settings: Record<string, string>,
  key: string,
  image: ImagePayload,
) {
  const provider = settings.storage_provider || "supabase";

  if (
    provider === "r2" &&
    settings.r2_access_key &&
    settings.r2_secret_key &&
    settings.r2_bucket_name
  ) {
    const endpoint = (settings.r2_endpoint || `https://${settings.r2_account_id}.r2.cloudflarestorage.com`).replace(/\/+$/, "");
    const bucket = settings.r2_bucket_name;
    const objectUrl = `${endpoint}/${bucket}/${key}`;

    const aws = new AwsClient({
      accessKeyId: settings.r2_access_key,
      secretAccessKey: settings.r2_secret_key,
      service: "s3",
      region: "auto",
    });

    const putResponse = await aws.fetch(objectUrl, {
      method: "PUT",
      headers: { "Content-Type": image.contentType },
      body: image.bytes,
    });

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      throw new Error(`R2 upload failed (${putResponse.status}): ${errText || "Unknown error"}`);
    }

    const publicBase = (settings.r2_public_url || `${endpoint}/${bucket}`).replace(/\/+$/, "");
    return `${publicBase}/${key}`;
  }

  if (
    provider === "cloudinary" &&
    settings.cloudinary_cloud_name &&
    settings.cloudinary_upload_preset
  ) {
    const formData = new FormData();
    formData.append("file", new Blob([image.bytes], { type: image.contentType }));
    formData.append("upload_preset", settings.cloudinary_upload_preset);
    formData.append("folder", "kenyaadverts/blog");

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${settings.cloudinary_cloud_name}/image/upload`,
      { method: "POST", body: formData },
    );

    if (cloudinaryRes.ok) {
      const json = await cloudinaryRes.json();
      if (json?.secure_url) return json.secure_url as string;
    }
  }

  const { error } = await supabase.storage
    .from("listing-images")
    .upload(key, image.bytes, { contentType: image.contentType, upsert: false, cacheControl: "3600" });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("listing-images").getPublicUrl(key);
  return data.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, draft, category } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const aiGatewayKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiGatewayKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settingsRows } = await supabase.from("admin_settings").select("key, value");
    const settings: Record<string, string> = Object.fromEntries(
      (settingsRows || []).map((row: any) => [row.key, row.value ?? ""]),
    );

    const systemPrompt = `You are a professional Kenyan blog writer for KenyaAdvert. Write SEO-focused article JSON.

Rules:
1. content must be HTML using only: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>
2. start content with <h2>, never <h1>
3. minimum content length 4000 chars
4. include Kenya-specific context (cities, KSh, M-Pesa, local shopping behavior)
5. include internal relative links like /search?q=laptop and /register
6. return JSON only (no markdown)

JSON fields required:
- title (50-70 chars)
- slug (lowercase hyphen-separated)
- excerpt (140-160 chars)
- category (Technology, Property, Vehicles, Business, Agriculture, Fashion, Safety, Lifestyle)
- read_time (e.g. "8 min")
- image_query (3-6 words for cover image search)
- content (full HTML)
`;

    const userMessage = draft
      ? `Rewrite this draft into a complete Kenya-focused article. Topic: "${topic}". Category hint: ${category || "auto"}. Draft:\n${draft}`
      : `Write a complete Kenya-focused article about: "${topic}". Category hint: ${category || "auto"}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiGatewayKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content || "";
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let article: any;
    try {
      article = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
      article = JSON.parse(jsonMatch[0]);
    }

    if (!article.title || !article.content || !article.slug) {
      throw new Error("AI response missing required fields (title, content, slug)");
    }

    const imageQuery = article.image_query || `${article.title} kenya`;
    const imageBlob = await fetchImageByQuery(imageQuery);
    const imageKey = `blog/${Date.now()}-${sanitizeSegment(article.slug || article.title)}.${imageBlob.extension}`;

    try {
      article.image_url = await uploadToActiveProvider(supabase, settings, imageKey, imageBlob);
    } catch (imageError) {
      console.error("Blog image upload failed:", imageError);
      article.image_url = "https://www.kenyaadverts.co.ke/og-image.png";
    }

    delete article.image_query;

    return new Response(JSON.stringify({ article }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
