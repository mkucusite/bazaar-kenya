import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate image
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Generate a realistic product photo: ${prompt}. Clean background, good lighting, professional.` }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Image gen error:", res.status, errText);
      return new Response(JSON.stringify({ error: "Image generation failed", imageUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const base64Url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64Url) {
      return new Response(JSON.stringify({ error: "No image generated", imageUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload to storage
    const base64Content = base64Url.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("ad-images")
      .upload(filename, bytes.buffer, { contentType: "image/png", cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed", imageUrl: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(uploadData.path);

    return new Response(JSON.stringify({ imageUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-listing-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", imageUrl: null }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
