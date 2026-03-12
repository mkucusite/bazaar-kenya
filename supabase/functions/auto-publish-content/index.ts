import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.637.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageData = { bytes: Uint8Array; contentType: string; ext: string };

type ListingDraft = {
  title: string;
  description: string;
  category: string;
  price: number;
  county: string;
  condition: string;
  image_query: string;
};

type BlogDraft = {
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  content: string;
  image_query: string;
};

const KENYA_LOCATIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kiambu", "Thika", "Kitengela", "Machakos", "Naivasha"];
const BLOG_CATEGORIES = ["Technology", "Property", "Vehicles", "Business", "Agriculture", "Fashion", "Safety", "Lifestyle"];
const DEFAULT_PHONE = "0115475543";
const DEFAULT_LOGO_URL = "https://www.kenyaadverts.co.ke/og-image.png";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseArrayJson<T>(raw: string): T[] {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

function extFromType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function fetchImageFromQuery(query: string): Promise<ImageData> {
  const urls = [
    `https://source.unsplash.com/1200x900/?${encodeURIComponent(`${query},kenya`)}`,
    `https://source.unsplash.com/1200x900/?${encodeURIComponent(query)}`,
    DEFAULT_LOGO_URL,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.length > 0) {
        return { bytes, contentType, ext: extFromType(contentType) };
      }
    } catch {
      // continue
    }
  }

  throw new Error("Unable to fetch image");
}

async function uploadImage(
  serviceSupabase: ReturnType<typeof createClient>,
  settings: Record<string, string>,
  key: string,
  image: ImageData,
) {
  const provider = settings.storage_provider || "supabase";

  if (
    provider === "r2" &&
    settings.r2_access_key &&
    settings.r2_secret_key &&
    settings.r2_bucket_name
  ) {
    const endpoint = settings.r2_endpoint || `https://${settings.r2_account_id}.r2.cloudflarestorage.com`;
    const s3 = new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: settings.r2_access_key,
        secretAccessKey: settings.r2_secret_key,
      },
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: settings.r2_bucket_name,
        Key: key,
        Body: image.bytes,
        ContentType: image.contentType,
      }),
    );

    const publicBase = (settings.r2_public_url || `${endpoint}/${settings.r2_bucket_name}`).replace(/\/+$/, "");
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
    formData.append("folder", "kenyaadverts/ai");

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${settings.cloudinary_cloud_name}/image/upload`,
      { method: "POST", body: formData },
    );

    if (cloudinaryRes.ok) {
      const json = await cloudinaryRes.json();
      if (json?.secure_url) return json.secure_url as string;
    }
  }

  const { error } = await serviceSupabase.storage
    .from("listing-images")
    .upload(key, image.bytes, { contentType: image.contentType, upsert: false, cacheControl: "3600" });

  if (error) throw new Error(error.message);

  const { data } = serviceSupabase.storage.from("listing-images").getPublicUrl(key);
  return data.publicUrl;
}

async function ensureUniqueBlogSlug(serviceSupabase: ReturnType<typeof createClient>, baseSlug: string) {
  let slug = baseSlug || `blog-${Date.now()}`;
  let counter = 1;

  while (true) {
    const { data } = await serviceSupabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
    if (!data || data.length === 0) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

async function generateListingsWithGemini(
  gatewayKey: string,
  categories: string[],
  count: number,
  categoryOverride?: string,
): Promise<ListingDraft[]> {
  const categoryHint = categoryOverride || "random across all categories";
  const prompt = `Generate ${count} realistic Kenyan marketplace listings in JSON array only.
Category mode: ${categoryHint}
Available categories: ${categories.join(", ")}
Return objects with: title, description, category, price, county, condition, image_query.
Rules:
- description 2-3 short sentences
- price is number in KES
- county must be Kenyan town/county
- condition one of: New, Used, Refurbished
- mix categories evenly when no override`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Gemini listing generation failed (${response.status})`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  return parseArrayJson<ListingDraft>(content);
}

function buildFallbackListings(categories: string[], count: number, categoryOverride?: string): ListingDraft[] {
  const targetCategories = categoryOverride ? [categoryOverride] : categories;
  return Array.from({ length: count }, (_, i) => {
    const category = targetCategories[i % targetCategories.length] || "Electronics";
    const county = KENYA_LOCATIONS[i % KENYA_LOCATIONS.length];
    return {
      title: `${category} Deal ${Date.now().toString().slice(-4)}-${i + 1}`,
      description: `Affordable ${category.toLowerCase()} listing in ${county}. Well maintained and ready for immediate sale. Contact seller for quick pickup.`,
      category,
      price: 900 + i * 350,
      county,
      condition: i % 2 === 0 ? "Used" : "New",
      image_query: `${category} kenya marketplace`,
    };
  });
}

async function generateBlogsWithGemini(gatewayKey: string, count: number): Promise<BlogDraft[]> {
  const prompt = `Generate ${count} Kenyan classifieds blog posts as JSON array only.
Return objects with: title, excerpt, category, read_time, content, image_query.
Rules:
- category one of: ${BLOG_CATEGORIES.join(", ")}
- excerpt max 160 chars
- content as HTML using tags: h2,h3,p,ul,li,strong,em,a
- include local examples (Nairobi, Mombasa, M-Pesa, KSh)
- 1200+ characters per post`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Gemini blog generation failed (${response.status})`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  return parseArrayJson<BlogDraft>(content);
}

function buildFallbackBlogs(count: number): BlogDraft[] {
  return Array.from({ length: count }, (_, i) => {
    const category = BLOG_CATEGORIES[i % BLOG_CATEGORIES.length];
    const title = `How to Buy and Sell ${category} in Kenya`;
    return {
      title,
      excerpt: `Practical Kenya guide for ${category.toLowerCase()} buyers and sellers, including pricing, safety and fast deal tips.`,
      category,
      read_time: "6 min",
      image_query: `${category} kenya business`,
      content: `<h2>${title}</h2><p>Kenyan buyers compare value quickly, so clear photos, honest condition details and realistic pricing in KSh make listings perform better.</p><h3>Price and trust matter</h3><p>Use local references such as Nairobi, Mombasa and Kisumu demand trends. Include your M-Pesa-ready contact and response times.</p><ul><li>Use specific title keywords</li><li>Add clear condition notes</li><li>Respond quickly to buyer questions</li></ul><p>Ready to post? Visit <a href="/post-ad">Post Ad</a> and start selling.</p>`,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "").trim();
    const body = await req.json().catch(() => ({}));

    const source = String(body?.source || "manual");
    const mode = String(body?.mode || "both") as "listings" | "blogs" | "both";
    const categoryOverride = body?.categoryOverride ? String(body.categoryOverride) : undefined;

    const serviceSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);

    const requesterId = String(claimsData.claims.sub || "");
    const requesterRole = String(claimsData.claims.role || "");

    const { data: settingRows } = await serviceSupabase.from("admin_settings").select("key, value");
    const settings: Record<string, string> = Object.fromEntries((settingRows || []).map((r: any) => [r.key, r.value ?? ""]));

    if (source === "cron") {
      const incomingCronSecret = String(body?.cron_secret || "");
      if (!incomingCronSecret || incomingCronSecret !== settings.ai_cron_secret) {
        return jsonResponse({ error: "Invalid cron secret" }, 401);
      }
      if (requesterRole !== "anon") {
        return jsonResponse({ error: "Cron calls must use anon token" }, 401);
      }
    } else {
      if (!requesterId) return jsonResponse({ error: "Unauthorized" }, 401);
      const { data: isAdminRow } = await serviceSupabase
        .from("user_roles")
        .select("id")
        .eq("user_id", requesterId)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      if (!isAdminRow) return jsonResponse({ error: "Forbidden" }, 403);
    }

    const aiEnabled = settings.ai_listings_enabled !== "false";
    const dailyEnabled = settings.ai_daily_enabled !== "false";

    if (source === "cron" && !dailyEnabled) {
      return jsonResponse({ ok: true, skipped: true, reason: "daily disabled" });
    }

    const { data: categoryRows } = await serviceSupabase.from("categories").select("id,name").order("sort_order");
    const categoryList = (categoryRows || []).map((r: any) => String(r.name)).filter(Boolean);

    const listingsCount = Math.min(Math.max(Number(body?.listingsCount ?? settings.ai_daily_listings_count ?? 20), 1), 100);
    const blogsCount = Math.min(Math.max(Number(body?.blogsCount ?? settings.ai_daily_blogs_count ?? 10), 0), 50);

    const defaultPhone = settings.ai_default_phone || DEFAULT_PHONE;
    const defaultWhatsapp = settings.ai_default_whatsapp || DEFAULT_PHONE;

    let ownerId = requesterId;
    if (!ownerId) {
      const { data: adminOwner } = await serviceSupabase.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
      ownerId = adminOwner?.user_id || "";
      if (!ownerId) {
        const { data: profileOwner } = await serviceSupabase.from("profiles").select("id").limit(1).maybeSingle();
        ownerId = profileOwner?.id || "";
      }
    }

    if (!ownerId) return jsonResponse({ error: "No owner user found for generated listings" }, 500);

    const gatewayKey = Deno.env.get("LOVABLE_API_KEY") || "";

    let listingDrafts: ListingDraft[] = [];
    let blogDrafts: BlogDraft[] = [];

    if ((mode === "listings" || mode === "both") && aiEnabled) {
      if (gatewayKey) {
        try {
          listingDrafts = await generateListingsWithGemini(gatewayKey, categoryList, listingsCount, categoryOverride);
        } catch {
          listingDrafts = buildFallbackListings(categoryList, listingsCount, categoryOverride);
        }
      } else {
        listingDrafts = buildFallbackListings(categoryList, listingsCount, categoryOverride);
      }

      if (listingDrafts.length === 0) listingDrafts = buildFallbackListings(categoryList, listingsCount, categoryOverride);
      listingDrafts = listingDrafts.slice(0, listingsCount);
    }

    if ((mode === "blogs" || mode === "both") && blogsCount > 0) {
      if (gatewayKey) {
        try {
          blogDrafts = await generateBlogsWithGemini(gatewayKey, blogsCount);
        } catch {
          blogDrafts = buildFallbackBlogs(blogsCount);
        }
      } else {
        blogDrafts = buildFallbackBlogs(blogsCount);
      }

      if (blogDrafts.length === 0) blogDrafts = buildFallbackBlogs(blogsCount);
      blogDrafts = blogDrafts.slice(0, blogsCount);
    }

    const categoryMap = new Map((categoryRows || []).map((row: any) => [normalizeText(String(row.name)), row.id]));

    const listingResult = { success: 0, errors: 0, items: [] as any[] };
    for (let i = 0; i < listingDrafts.length; i += 1) {
      const item = listingDrafts[i];
      try {
        const categoryName = categoryOverride || item.category || categoryList[i % Math.max(categoryList.length, 1)] || "Electronics";
        const categoryId = categoryMap.get(normalizeText(categoryName)) || null;
        const county = item.county || KENYA_LOCATIONS[i % KENYA_LOCATIONS.length];
        const image = await fetchImageFromQuery(item.image_query || item.title || categoryName);
        const imageKey = `ads/${Date.now()}-${slugify(item.title || categoryName)}-${i}.${image.ext}`;
        const imageUrl = await uploadImage(serviceSupabase, settings, imageKey, image);

        const { data: inserted, error } = await serviceSupabase
          .from("ads")
          .insert({
            user_id: ownerId,
            title: item.title || `${categoryName} Listing ${i + 1}`,
            description: item.description || `Affordable ${categoryName} listing available in ${county}.`,
            price: Number(item.price) || 1000,
            county,
            town: county,
            phone: defaultPhone,
            whatsapp: defaultWhatsapp,
            condition: item.condition || "Used",
            images: [imageUrl],
            badge: "standard",
            status: "active",
            ai_generated: true,
            category_id: categoryId,
          } as any)
          .select("id,title,images,created_at")
          .single();

        if (error) throw error;
        listingResult.success += 1;
        listingResult.items.push(inserted);
      } catch (e) {
        console.error("auto listing insert failed", e);
        listingResult.errors += 1;
      }
    }

    const blogResult = { success: 0, errors: 0, items: [] as any[] };
    for (let i = 0; i < blogDrafts.length; i += 1) {
      const item = blogDrafts[i];
      try {
        const baseSlug = slugify(item.title || `kenya-market-${Date.now()}-${i}`);
        const slug = await ensureUniqueBlogSlug(serviceSupabase, baseSlug || `post-${Date.now()}-${i}`);

        const image = await fetchImageFromQuery(item.image_query || item.title || "kenya marketplace");
        const imageKey = `blog/${Date.now()}-${slug}.${image.ext}`;
        const imageUrl = await uploadImage(serviceSupabase, settings, imageKey, image);

        const { data: inserted, error } = await serviceSupabase
          .from("blog_posts")
          .insert({
            title: item.title || `Kenya Marketplace Tips ${i + 1}`,
            slug,
            excerpt: item.excerpt || "Latest insights for buyers and sellers in Kenya.",
            content: item.content || "<h2>Kenya Marketplace Update</h2><p>Fresh insights for your buying and selling journey.</p>",
            category: BLOG_CATEGORIES.includes(item.category) ? item.category : BLOG_CATEGORIES[i % BLOG_CATEGORIES.length],
            read_time: item.read_time || "6 min",
            image: imageUrl,
            author: "KenyaAdvert Team",
            is_published: true,
          } as any)
          .select("id,title,slug,created_at")
          .single();

        if (error) throw error;
        blogResult.success += 1;
        blogResult.items.push(inserted);
      } catch (e) {
        console.error("auto blog insert failed", e);
        blogResult.errors += 1;
      }
    }

    await serviceSupabase
      .from("admin_settings")
      .upsert({ key: "ai_last_daily_run", value: new Date().toISOString() } as any, { onConflict: "key" });

    return jsonResponse({ ok: true, source, mode, listings: listingResult, blogs: blogResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
