import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, draft, category, generateImage } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional Kenyan blog writer for KenyaAdvert, Kenya's leading classifieds platform. You write comprehensive, SEO-optimised articles in HTML format.

STRICT FORMAT RULES — follow these EXACTLY:
1. Use ONLY these HTML tags: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>
2. NEVER use markdown (no ##, no **, no - lists). Output pure HTML only.
3. Start the article with an <h2> heading, NOT <h1>.
4. Every article MUST be at least 4000 characters long — aim for 5000-6000.
5. Include internal links to KenyaAdvert using relative paths like <a href="/search?q=laptop">KenyaAdvert</a> or <a href="/register">sign up</a>.
6. Write in a warm, informative, conversational tone that speaks directly to Kenyan readers.
7. Include specific Kenyan context: mention cities (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret), M-Pesa, local brands, KSh pricing, and real-world scenarios.
8. Structure: Opening paragraph → Multiple sections with <h2>/<h3> → Practical tips as <ul> lists → Call to action linking to KenyaAdvert.
9. Do NOT include the article title in the content — it will be rendered separately.
10. Do NOT wrap the entire content in any container tag.

Also return a JSON object with these fields:
- title: SEO-optimised article title (50-70 chars, include "Kenya")
- slug: URL-friendly slug (lowercase, hyphens, no special chars)
- excerpt: Compelling meta description (140-160 chars)
- category: One of: Technology, Property, Vehicles, Business, Agriculture, Fashion, Safety, Lifestyle
- read_time: Estimated reading time like "8 min"
- content: The full HTML article content

Return ONLY valid JSON, no markdown code fences.`;

    const userMessage = draft
      ? `Here is a draft/notes for an article. Rewrite it into a comprehensive, professional KenyaAdvert blog article following the format rules exactly. Topic: "${topic}". Category hint: ${category || "auto-detect"}.\n\nDraft:\n${draft}`
      : `Write a comprehensive, professional KenyaAdvert blog article about: "${topic}". Category hint: ${category || "auto-detect"}. Follow the format rules exactly.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content || "";
    rawContent = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    let article;
    try {
      article = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        article = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    if (!article.title || !article.content || !article.slug) {
      throw new Error("AI response missing required fields (title, content, slug)");
    }

    // Generate cover image if requested
    let generatedImageUrl: string | null = null;
    if (generateImage !== false) {
      try {
        const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: `Generate a professional blog cover image about: ${article.title}. Colorful, modern, editorial style, suitable for a Kenyan audience. No text overlay.` }],
            modalities: ["image", "text"],
          }),
        });

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const base64Url = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (base64Url) {
            // Upload to storage
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const base64Content = base64Url.replace(/^data:image\/\w+;base64,/, "");
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

            const filename = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("ad-images")
              .upload(filename, bytes.buffer, { contentType: "image/png", cacheControl: "3600", upsert: false });

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(uploadData.path);
              generatedImageUrl = urlData.publicUrl;
            }
          }
        }
      } catch (imgErr) {
        console.error("Blog image generation failed:", imgErr);
      }
    }

    return new Response(JSON.stringify({ article, generatedImageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
