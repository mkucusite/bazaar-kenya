import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageData = { bytes: Uint8Array; contentType: string; ext: string };

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes);
  return copy.buffer as ArrayBuffer;
}

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

type CategoryStats = {
  id: string;
  name: string;
  activeCount: number;
};

type CategoryBlueprint = {
  examples: string[];
  prompt: string;
  imageHint: string;
  minPrice: number;
  maxPrice: number;
  conditionOptions: string[];
};

const KENYA_LOCATIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Kiambu", "Thika", "Kitengela", "Machakos", "Naivasha"];
const BLOG_CATEGORIES = ["Technology", "Property", "Vehicles", "Business", "Agriculture", "Fashion", "Safety", "Lifestyle"];
const DEFAULT_PHONE = "0115475543";
const IGNORED_AUTO_CATEGORIES = new Set(["Business Profiles", "Deals", "Classifieds"]);
const FALLBACK_LISTING_IMAGE = "https://www.kenyaadverts.com/og-image.png";
const FALLBACK_BLOG_IMAGE = "https://www.kenyaadverts.com/og/og-blog.png";

const CATEGORY_BLUEPRINTS: Record<string, CategoryBlueprint> = {
  Electronics: {
    examples: ["Samsung Galaxy S24 Ultra 256GB", "iPhone 15 Pro Max 256GB", "HP EliteBook Core i7 16GB RAM", "Samsung 55 Inch 4K Smart TV"],
    prompt: "Focus on real consumer electronics commonly sold in Kenya such as phones, laptops, TVs, sound systems and appliances.",
    imageHint: "clean product photo of the exact electronics item",
    minPrice: 7500,
    maxPrice: 245000,
    conditionOptions: ["New", "Used", "Refurbished"],
  },
  "Home, Garden & Kids": {
    examples: ["7 Seater Fabric Sofa Set", "Baby Stroller with Canopy", "Mahogany Dining Table Set", "Orthopedic 5x6 Mattress"],
    prompt: "Focus on furniture, baby items, home décor, kitchenware and garden essentials.",
    imageHint: "home product marketplace photo",
    minPrice: 1800,
    maxPrice: 95000,
    conditionOptions: ["New", "Used"],
  },
  Vehicles: {
    examples: ["Toyota Vitz 2018 Automatic", "Honda Fit Hybrid 2016", "Boxer BM150 Motorcycle", "Isuzu D-Max Double Cab 2019"],
    prompt: "Focus on real vehicles seen in Kenya such as saloon cars, SUVs, pickups and motorcycles.",
    imageHint: "clear vehicle exterior photo",
    minPrice: 85000,
    maxPrice: 3650000,
    conditionOptions: ["Used", "New"],
  },
  "Car Parts & Accessories": {
    examples: ["Toyota Axio Alloy Rims Set", "Android Car Stereo 9 Inch", "Michelin Tyres 16 Inch Pair", "Bosch Car Battery 75Ah"],
    prompt: "Focus on real spare parts and car accessories sold individually or in small bundles.",
    imageHint: "car part product photo",
    minPrice: 1200,
    maxPrice: 85000,
    conditionOptions: ["New", "Used"],
  },
  "Property Rentals & Sales": {
    examples: ["2 Bedroom Apartment in Kilimani", "Bedsitter in Roysambu", "50x100 Plot in Kitengela", "Shop Space for Rent in Nairobi CBD"],
    prompt: "Focus on houses, apartments, plots, offices and commercial spaces in Kenya.",
    imageHint: "property exterior or interior photo that matches the listing",
    minPrice: 8000,
    maxPrice: 12500000,
    conditionOptions: ["New", "Used"],
  },
  Jobs: {
    examples: ["Receptionist Job in Westlands", "Graphic Designer Vacancy in Nairobi", "Sales Attendant Job in Nakuru", "Delivery Rider Job in Mombasa"],
    prompt: "Focus on credible job openings with salary figures in KES per month.",
    imageHint: "workplace photo matching the job role",
    minPrice: 18000,
    maxPrice: 180000,
    conditionOptions: ["New"],
  },
  "Entertainment, Sports & Travel": {
    examples: ["Treadmill for Home Gym", "PS5 Console with Two Pads", "Diani Weekend Getaway Package", "Mountain Bike 26 Inch"],
    prompt: "Focus on sports gear, gaming, travel packages and leisure products.",
    imageHint: "sports or entertainment item photo",
    minPrice: 2500,
    maxPrice: 185000,
    conditionOptions: ["New", "Used"],
  },
  "Commercial Supplies": {
    examples: ["Display Fridge for Shop", "POS Machine Touch Screen", "Bakery Oven Double Deck", "Salon Barber Chair"],
    prompt: "Focus on equipment and supplies used by businesses and small shops.",
    imageHint: "commercial equipment photo",
    minPrice: 5500,
    maxPrice: 420000,
    conditionOptions: ["New", "Used"],
  },
  "Farming & Agriculture": {
    examples: ["Irrigation Water Pump", "Dairy Friesian Cow", "Greenhouse Polythene Roll", "Layer Chicken Feeds 70kg"],
    prompt: "Focus on real farming equipment, livestock, feeds and agricultural inputs.",
    imageHint: "farm product or equipment photo",
    minPrice: 1500,
    maxPrice: 320000,
    conditionOptions: ["New", "Used"],
  },
  Services: {
    examples: ["Plumbing Services in Nairobi", "House Moving Service in Nakuru", "Professional Cleaning Services", "Electrician Services in Mombasa"],
    prompt: "Focus on service providers with clear deliverables and local coverage.",
    imageHint: "service provider at work matching the listing",
    minPrice: 1000,
    maxPrice: 45000,
    conditionOptions: ["New"],
  },
  "Building Supplies": {
    examples: ["600x600 Ceramic Floor Tiles", "Black Water Tank 5000 Litres", "TMT Steel Bars 12mm", "Cement Blocks Machine Cut"],
    prompt: "Focus on construction materials, tools and site supplies.",
    imageHint: "building material product photo",
    minPrice: 800,
    maxPrice: 280000,
    conditionOptions: ["New"],
  },
  "Fashion, Health & Beauty": {
    examples: ["Ladies Ankara Dress", "Human Hair Wig 14 Inch", "Men Leather Official Shoes", "Skincare Gift Set"],
    prompt: "Focus on clothing, shoes, beauty items, wigs and wellness products.",
    imageHint: "fashion or beauty product photo",
    minPrice: 700,
    maxPrice: 45000,
    conditionOptions: ["New", "Used"],
  },
};

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

function parseObjectJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : null;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as T : null;
    } catch {
      return null;
    }
  }
}

function extFromType(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampPrice(value: number, min: number, max: number) {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded <= 0) return randomInt(min, max);
  if (rounded < min) return randomInt(min, Math.max(min + 1, Math.min(max, min * 2)));
  if (rounded > max) return randomInt(Math.max(min, Math.floor(max * 0.6)), max);
  return rounded;
}

function getBlueprint(categoryName: string): CategoryBlueprint {
  return CATEGORY_BLUEPRINTS[categoryName] || {
    examples: [`${categoryName} Item in Kenya`, `${categoryName} Product`, `${categoryName} Offer`],
    prompt: `Focus on realistic products or services that clearly belong to ${categoryName}.`,
    imageHint: `${categoryName} marketplace photo`,
    minPrice: 1000,
    maxPrice: 120000,
    conditionOptions: ["New", "Used"],
  };
}

function buildBalancedCategoryPlan(categories: CategoryStats[], count: number, categoryOverride?: string) {
  if (categoryOverride) {
    const normalized = normalizeText(categoryOverride);
    const matched = categories.find((item) => normalizeText(item.name) === normalized) || categories.find((item) => normalizeText(item.name).includes(normalized));
    const target = matched || { id: "", name: categoryOverride, activeCount: 0 };
    return Array.from({ length: count }, () => target);
  }

  const eligible = categories.filter((item) => !IGNORED_AUTO_CATEGORIES.has(item.name));
  const pool = eligible.length > 0 ? eligible : categories;
  const simulated = pool.map((item) => ({ ...item }));
  const plan: CategoryStats[] = [];

  for (let i = 0; i < count; i += 1) {
    simulated.sort((a, b) => a.activeCount - b.activeCount || a.name.localeCompare(b.name));
    const selected = simulated[0];
    if (!selected) break;
    plan.push({ ...selected });
    selected.activeCount += 1;
  }

  return plan;
}

function buildFallbackListing(categoryName: string, county: string, blueprint: CategoryBlueprint, index: number): ListingDraft {
  const title = blueprint.examples[index % blueprint.examples.length] || `${categoryName} Item ${index + 1}`;
  return {
    title,
    description: `${title} available in ${county}, Kenya. Well presented with a realistic market price, clear condition details and ready for quick buyer response on KenyaAdvert.`.slice(0, 280),
    category: categoryName,
    price: randomInt(blueprint.minPrice, blueprint.maxPrice),
    county,
    condition: blueprint.conditionOptions[index % blueprint.conditionOptions.length] || "New",
    image_query: `${title}, ${blueprint.imageHint}, Kenya marketplace photo`,
  };
}

async function generateImageWithAI(
  gatewayKey: string,
  payload: { title: string; category: string; description?: string; imageQuery?: string },
): Promise<ImageData> {
  if (!gatewayKey) throw new Error("Lovable AI image generation is not configured");

  const subject = payload.imageQuery || payload.title;
  const basePrompt = `Photorealistic product catalog photo of: ${subject}. Category: ${payload.category}. The image MUST clearly show ${subject} as the main subject, exactly matching the listing title and description. Clean studio background or realistic selling environment. Sharp focus, natural lighting, no text, no watermarks, no logos, no collages, no abstract art, no landscapes unless the subject itself is a landscape.`;

  // Try OpenAI gpt-image-2 first (best subject accuracy), then Gemini image as fallback.
  const attempts: Array<{ url: string; body: Record<string, unknown>; parser: (data: any) => string | null }> = [
    {
      url: "https://ai.gateway.lovable.dev/v1/images/generations",
      body: { model: "openai/gpt-image-2", prompt: basePrompt, size: "1024x1024", quality: "low", n: 1 },
      parser: (data) => {
        const b64 = data?.data?.[0]?.b64_json;
        return b64 ? `data:image/png;base64,${b64}` : null;
      },
    },
    {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      body: {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: basePrompt }],
        modalities: ["image", "text"],
      },
      parser: (data) => data?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null,
    },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${gatewayKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(attempt.body),
      });
      if (!response.ok) throw new Error(`AI image gen failed (${response.status})`);
      const data = await response.json();
      const imageUrl = attempt.parser(data);
      if (!imageUrl || !imageUrl.startsWith("data:image/")) throw new Error("No image in AI response");

      const matches = imageUrl.match(/^data:image\/([\w+]+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image");
      const contentType = `image/${matches[1]}`;
      const ext = extFromType(contentType);
      const binaryStr = atob(matches[2]);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      return { bytes, contentType, ext };
    } catch (error) {
      console.error("AI image attempt failed", error);
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Image generation failed");
}

async function uploadImage(
  serviceSupabase: any,
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
      body: bytesToArrayBuffer(image.bytes),
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
    formData.append("file", new Blob([bytesToArrayBuffer(image.bytes)], { type: image.contentType }));
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

async function ensureUniqueBlogSlug(serviceSupabase: any, baseSlug: string) {
  let slug = baseSlug || `blog-${Date.now()}`;
  let counter = 1;

  while (true) {
    const { data } = await serviceSupabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
    if (!data || data.length === 0) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

async function generateSingleListingWithGemini(
  gatewayKey: string,
  categoryName: string,
  county: string,
  blueprint: CategoryBlueprint,
): Promise<ListingDraft | null> {
  const prompt = `Generate ONE Kenyan marketplace listing as a JSON object only.
Required keys: title, description, category, price, county, condition, image_query.
Rules:
- category must be exactly "${categoryName}"
- county must be exactly "${county}"
- choose a realistic item or service from these examples: ${blueprint.examples.join(", ")}
- ${blueprint.prompt}
- title must be natural, specific, human-like and not templated
- do not use the words deal, listing, offer, batch, generated, placeholder, sample or random numbers in the title
- description must be 2 or 3 rich sentences, between 180 and 320 characters, and match the title
- price must be a sensible number in Kenyan shillings between ${blueprint.minPrice} and ${blueprint.maxPrice}
- condition must be one of: ${blueprint.conditionOptions.join(", ")}
- image_query must describe the exact visible subject for a photorealistic marketplace photo and must match the title
- make it feel local to Kenya`;

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
  const content = data.choices?.[0]?.message?.content || "{}";
  return parseObjectJson<ListingDraft>(content);
}

async function generateBlogsWithGemini(gatewayKey: string, count: number): Promise<BlogDraft[]> {
  const prompt = `Generate ${count} Kenyan classifieds blog posts as JSON array only.
Return objects with: title, excerpt, category, read_time, content, image_query.
Rules:
- category one of: ${BLOG_CATEGORIES.join(", ")}
- excerpt between 130 and 160 chars
- content as HTML using tags: h2,h3,p,ul,li,strong,em,a
- include local examples (Nairobi, Mombasa, M-Pesa, KSh)
- 1600+ characters per post
- every image_query must clearly match the article topic and be different from the others`;

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
      image_query: `${title}, article hero image, Kenya`,
      content: `<h2>${title}</h2><p>Kenyan buyers compare value quickly, so clear photos, honest condition details and realistic pricing in KSh make listings perform better.</p><h3>Price and trust matter</h3><p>Use local references such as Nairobi, Mombasa and Kisumu demand trends. Include your M-Pesa-ready contact and response times.</p><ul><li>Use specific title keywords</li><li>Add clear condition notes</li><li>Respond quickly to buyer questions</li></ul><p>Ready to post? Visit <a href="/post-ad">Post Ad</a> and start selling.</p>`,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    const source = String(body?.source || "manual");
    const mode = String(body?.mode || "both") as "listings" | "blogs" | "both";
    const categoryOverride = body?.categoryOverride ? String(body.categoryOverride) : undefined;

    const serviceSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: settingRows } = await serviceSupabase.from("admin_settings").select("key, value");
    const settings: Record<string, string> = Object.fromEntries((settingRows || []).map((r: any) => [r.key, r.value ?? ""]));

    // Auth: accept either a valid cron_secret (for scheduled / server calls) or an admin user JWT.
    const incomingCronSecret = String(body?.cron_secret || req.headers.get("x-cron-secret") || "");
    const isCronAuthorized = !!settings.ai_cron_secret && incomingCronSecret === settings.ai_cron_secret;

    let requesterId = "";
    if (!isCronAuthorized) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
      const token = authHeader.replace("Bearer ", "").trim();
      const authSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) return jsonResponse({ error: "Unauthorized" }, 401);
      requesterId = String(claimsData.claims.sub || "");
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
    const { data: activeAdRows } = await serviceSupabase.from("ads").select("category_id").eq("status", "active").limit(50000);
    const activeCountMap = new Map<string, number>();
    for (const row of activeAdRows || []) {
      const categoryId = String((row as any).category_id || "");
      if (!categoryId) continue;
      activeCountMap.set(categoryId, (activeCountMap.get(categoryId) || 0) + 1);
    }

    const categoryStats: CategoryStats[] = (categoryRows || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      activeCount: activeCountMap.get(String(row.id)) || 0,
    }));

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
    const listingPlan = buildBalancedCategoryPlan(categoryStats, listingsCount, categoryOverride);

    if ((mode === "listings" || mode === "both") && aiEnabled) {
      for (let i = 0; i < listingPlan.length; i += 1) {
        const targetCategory = listingPlan[i];
        const categoryName = targetCategory?.name || categoryOverride || "Electronics";
        const blueprint = getBlueprint(categoryName);
        const county = KENYA_LOCATIONS[i % KENYA_LOCATIONS.length];

        if (gatewayKey) {
          try {
            const generated = await generateSingleListingWithGemini(gatewayKey, categoryName, county, blueprint);
            if (generated) {
              listingDrafts.push({
                title: generated.title || blueprint.examples[i % blueprint.examples.length],
                description: generated.description || buildFallbackListing(categoryName, county, blueprint, i).description,
                category: categoryName,
                price: clampPrice(Number(generated.price), blueprint.minPrice, blueprint.maxPrice),
                county,
                condition: blueprint.conditionOptions.includes(generated.condition) ? generated.condition : blueprint.conditionOptions[0],
                image_query: generated.image_query || `${generated.title || blueprint.examples[i % blueprint.examples.length]}, ${blueprint.imageHint}`,
              });
              continue;
            }
          } catch (error) {
            console.error("single listing generation failed", error);
          }
        }

        listingDrafts.push(buildFallbackListing(categoryName, county, blueprint, i));
      }
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
        const categoryName = categoryOverride || item.category || listingPlan[i]?.name || "Electronics";
        const categoryId = categoryMap.get(normalizeText(categoryName)) || null;
        const county = item.county || KENYA_LOCATIONS[i % KENYA_LOCATIONS.length];
        let imageUrl = FALLBACK_LISTING_IMAGE;
        if (gatewayKey) {
          try {
            const image = await generateImageWithAI(gatewayKey, {
              title: item.title || `${categoryName} Listing ${i + 1}`,
              category: categoryName,
              description: item.description,
              imageQuery: item.image_query || item.title || categoryName,
            });
            const imageKey = `ads/${Date.now()}-${slugify(item.title || categoryName)}-${i}.${image.ext}`;
            imageUrl = await uploadImage(serviceSupabase, settings, imageKey, image);
          } catch (imageError) {
            console.error("AI image generation failed; using fallback image", imageError);
          }
        }

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

        let imageUrl = FALLBACK_BLOG_IMAGE;
        if (gatewayKey) {
          try {
            const image = await generateImageWithAI(gatewayKey, {
              title: item.title || `Kenya Marketplace Tips ${i + 1}`,
              category: item.category || BLOG_CATEGORIES[i % BLOG_CATEGORIES.length],
              description: item.excerpt,
              imageQuery: item.image_query || item.title || "kenya marketplace",
            });
            const imageKey = `blog/${Date.now()}-${slug}.${image.ext}`;
            imageUrl = await uploadImage(serviceSupabase, settings, imageKey, image);
          } catch (imageError) {
            console.error("AI blog image generation failed; using fallback image", imageError);
          }
        }

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
