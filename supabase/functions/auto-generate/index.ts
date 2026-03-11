import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KENYA_LOCATIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Westlands", "Kilimani", "Roysambu", "Thika", "Kitengela", "Nyeri", "Machakos", "Malindi", "Nanyuki", "Ruaka"];
const DEFAULT_PHONE = "0115475543";
const DEFAULT_WHATSAPP = "0115475543";

async function getAdminSettings(supabase: any): Promise<Record<string, string>> {
  const { data } = await supabase.from("admin_settings").select("key, value");
  return Object.fromEntries((data || []).map((r: any) => [r.key, r.value]));
}

async function getCategories(supabase: any): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase.from("categories").select("id, name").order("sort_order");
  return data || [];
}

async function generateImage(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Generate a realistic product photo for a classifieds listing: ${prompt}. Clean background, good lighting, professional look.` }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
}

async function uploadBase64ToR2(supabase: any, settings: Record<string, string>, base64Data: string, filename: string): Promise<string | null> {
  if (!settings.r2_access_key || !settings.r2_secret_key || !settings.r2_bucket_name || settings.storage_provider !== "r2") {
    return null;
  }
  try {
    // Upload via Supabase storage as fallback since we're server-side
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    
    const { data, error } = await supabase.storage
      .from("ad-images")
      .upload(filename, bytes.buffer, { contentType: "image/png", cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (e) {
    console.error("Storage upload failed:", e);
    return null;
  }
}

async function generateListings(supabase: any, settings: Record<string, string>, categories: { id: string; name: string }[], count: number, lovableKey: string) {
  if (categories.length === 0) return { success: 0, errors: 0 };

  // Get admin user (first admin)
  const { data: adminRole } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1).single();
  if (!adminRole) { console.error("No admin user found"); return { success: 0, errors: 0 }; }
  const adminId = adminRole.user_id;

  // Distribute across categories
  const perCategory = Math.max(1, Math.floor(count / categories.length));
  let remaining = count;
  let success = 0, errors = 0;

  for (const cat of categories) {
    if (remaining <= 0) break;
    const batchCount = Math.min(perCategory + (remaining > perCategory * categories.length ? 1 : 0), remaining);

    try {
      // Generate listing data with Gemini
      const prompt = `Generate ${batchCount} realistic Kenyan classifieds listings for category "${cat.name}".
Return ONLY a valid JSON array. No markdown, no backticks.
Each object: title (max 80 chars), description (2-3 sentences, max 300 chars), price (number in KSh), location (one of: ${KENYA_LOCATIONS.join(", ")}), condition (New, Used - Like New, Used - Good, Used - Fair), image_prompt (descriptive prompt to generate a product photo, 10-15 words).
Make it realistic for Kenya. Vary prices, locations, conditions.`;

      const genRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!genRes.ok) {
        console.error(`Gemini listing gen failed: ${genRes.status}`);
        errors += batchCount;
        remaining -= batchCount;
        continue;
      }

      const genData = await genRes.json();
      let text = genData.choices?.[0]?.message?.content || "";
      text = text.replace(/```json|```/g, "").trim();
      const listings = JSON.parse(text);

      for (const listing of listings) {
        if (remaining <= 0) break;
        try {
          // Generate image
          let imageUrl: string | null = null;
          const imgPrompt = listing.image_prompt || listing.title;
          const base64Image = await generateImage(lovableKey, imgPrompt);
          
          if (base64Image) {
            const fname = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
            imageUrl = await uploadBase64ToR2(supabase, settings, base64Image, fname);
          }

          if (!imageUrl) {
            // Fallback to Unsplash
            imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(listing.title.split(" ").slice(0, 3).join(" "))}`;
          }

          const { error } = await supabase.from("ads").insert({
            user_id: adminId,
            title: listing.title,
            description: listing.description,
            price: Number(listing.price) || 0,
            county: listing.location || KENYA_LOCATIONS[Math.floor(Math.random() * KENYA_LOCATIONS.length)],
            town: listing.location || KENYA_LOCATIONS[Math.floor(Math.random() * KENYA_LOCATIONS.length)],
            phone: DEFAULT_PHONE,
            whatsapp: DEFAULT_WHATSAPP,
            condition: listing.condition || "Used - Good",
            images: [imageUrl],
            badge: "standard",
            status: "active",
            ai_generated: true,
            category_id: cat.id,
          });

          if (error) { console.error("Insert listing error:", error); errors++; }
          else success++;
        } catch (e) {
          console.error("Listing insert error:", e);
          errors++;
        }
        remaining--;
      }
    } catch (e) {
      console.error(`Category ${cat.name} generation failed:`, e);
      errors += batchCount;
      remaining -= batchCount;
    }
  }

  return { success, errors };
}

async function generateBlogs(supabase: any, settings: Record<string, string>, count: number, lovableKey: string) {
  let success = 0, errors = 0;

  const topics = [
    "buying second-hand electronics in Kenya", "how to sell property fast in Nairobi",
    "best cars under 1 million KSh in Kenya", "starting a small business in Kenya",
    "safe online shopping tips in Kenya", "affordable fashion trends in Nairobi",
    "farming equipment you can buy online", "how to spot scams on classifieds sites",
    "top smartphones for M-Pesa business", "renting vs buying a house in Kenya",
    "how to price your products on classifieds", "best areas to live in Nairobi on a budget",
    "maintaining a used car bought online", "kids items worth buying second-hand",
    "why verified sellers matter on classifieds", "home office setup guide for Kenyans",
    "motorcycle business opportunities in Kenya", "pet care products available in Kenya",
    "beauty products trending in Mombasa", "freelance services you can sell online in Kenya",
  ];

  for (let i = 0; i < count; i++) {
    try {
      const topic = topics[Math.floor(Math.random() * topics.length)];

      // Generate blog content
      const blogRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `You are a professional Kenyan blog writer for KenyaAdvert, Kenya's leading classifieds platform. Write comprehensive, SEO-optimised articles in HTML format. Use ONLY: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>. No markdown. Start with <h2>. At least 4000 characters. Include internal links using relative paths. Warm, informative tone. Kenyan context: cities, M-Pesa, KSh. Return ONLY valid JSON: { "title": "...", "slug": "...", "excerpt": "...", "category": "...", "read_time": "...", "content": "..." }. No markdown fences.` },
            { role: "user", content: `Write a comprehensive KenyaAdvert blog article about: "${topic}". Make it unique and fresh.` },
          ],
        }),
      });

      if (!blogRes.ok) { console.error("Blog gen failed:", blogRes.status); errors++; continue; }
      const blogData = await blogRes.json();
      let rawContent = blogData.choices?.[0]?.message?.content || "";
      rawContent = rawContent.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      
      let article;
      try {
        article = JSON.parse(rawContent);
      } catch {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) article = JSON.parse(jsonMatch[0]);
        else { errors++; continue; }
      }

      if (!article.title || !article.content || !article.slug) { errors++; continue; }

      // Generate blog cover image
      let blogImage: string | null = null;
      const imgData = await generateImage(lovableKey, `Blog cover image about ${article.title}, professional, colorful, Kenya theme`);
      if (imgData) {
        const fname = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
        blogImage = await uploadBase64ToR2(supabase, settings, imgData, fname);
      }
      if (!blogImage) {
        blogImage = `https://source.unsplash.com/1200x630/?${encodeURIComponent(topic.split(" ").slice(0, 3).join(" "))}`;
      }

      // Check slug uniqueness
      const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", article.slug).maybeSingle();
      if (existing) article.slug = `${article.slug}-${Date.now().toString(36)}`;

      const { error } = await supabase.from("blog_posts").insert({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || "",
        content: article.content,
        category: article.category || "Lifestyle",
        read_time: article.read_time || "5 min",
        image: blogImage,
        author: "KenyaAdvert Team",
        is_published: true,
      });

      if (error) { console.error("Blog insert error:", error); errors++; }
      else success++;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error("Blog generation error:", e);
      errors++;
    }
  }

  return { success, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings = await getAdminSettings(supabase);
    const categories = await getCategories(supabase);

    // Check settings
    const listingCount = parseInt(settings.ai_auto_listings_count || "20");
    const blogCount = parseInt(settings.ai_auto_blogs_count || "10");
    const autoEnabled = settings.ai_auto_enabled !== "false";

    // Allow manual trigger via POST body
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body for cron */ }
    
    const mode = body.mode || "all"; // "all", "listings", "blogs"
    const customListingCount = body.listing_count || listingCount;
    const customBlogCount = body.blog_count || blogCount;

    if (!autoEnabled && !body.mode) {
      return new Response(JSON.stringify({ message: "Auto-generation is disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let listingResult = { success: 0, errors: 0 };
    let blogResult = { success: 0, errors: 0 };

    if (mode === "all" || mode === "listings") {
      console.log(`Generating ${customListingCount} listings across ${categories.length} categories...`);
      listingResult = await generateListings(supabase, settings, categories, customListingCount, lovableKey);
      console.log(`Listings: ${listingResult.success} success, ${listingResult.errors} errors`);
    }

    if (mode === "all" || mode === "blogs") {
      console.log(`Generating ${customBlogCount} blogs...`);
      blogResult = await generateBlogs(supabase, settings, customBlogCount, lovableKey);
      console.log(`Blogs: ${blogResult.success} success, ${blogResult.errors} errors`);
    }

    return new Response(JSON.stringify({
      listings: listingResult,
      blogs: blogResult,
      message: `Generated ${listingResult.success} listings and ${blogResult.success} blogs`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
