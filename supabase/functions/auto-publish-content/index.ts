import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageData = { bytes: Uint8Array; contentType: string; ext: string };

class AiUnavailableError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AiUnavailableError";
    this.status = status;
  }
}

function isAiUnavailable(error: unknown) {
  return error instanceof AiUnavailableError || (error instanceof Error && /\b(402|429)\b|credits|payment_required|rate/i.test(error.message));
}

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

type AdImageBackfillItem = {
  id: string;
  title: string;
  description: string | null;
  county: string | null;
  category_id: string | null;
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

function stripBrandSuffix(value: string) {
  return (value || "")
    .replace(/\s*[|—\-–·•:]\s*Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i, "")
    .replace(/\s*[|—\-–·•:]\s*KenyaAdvert(?:s)?(?:\.com)?\s*$/i, "")
    .replace(/\s+on\s+Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clampMeta(value: string, max: number) {
  const clean = stripBrandSuffix(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 35 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:|—\-]+$/, "")}…`;
}

function buildMetaDescription(title: string, description: string, county: string, category: string) {
  const plain = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const base = plain.length > 70 ? plain : `${title} available in ${county}, Kenya. Compare ${category.toLowerCase()} prices, view details and contact the seller directly.`;
  return clampMeta(base, 155);
}

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
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

function escapeSvg(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSubjectFallbackImage(payload: { title: string; category: string; county?: string }): ImageData {
  const title = escapeSvg(stripBrandSuffix(payload.title).slice(0, 64));
  const category = escapeSvg(payload.category || "Listing");
  const icon = /vehicle|car|toyota|nissan|mazda|subaru|honda|motor|bike/i.test(`${payload.title} ${payload.category}`)
    ? "🚗"
    : /phone|laptop|tv|electronics|computer|iphone|samsung|hp|dell/i.test(`${payload.title} ${payload.category}`)
      ? "💻"
      : /property|house|apartment|plot|rent/i.test(`${payload.title} ${payload.category}`)
        ? "🏠"
        : /job|vacancy|work/i.test(`${payload.title} ${payload.category}`)
          ? "💼"
          : "🛒";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f2f1a"/><stop offset="1" stop-color="#1b5e20"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><rect x="70" y="70" width="1060" height="760" rx="46" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)"/><text x="600" y="350" text-anchor="middle" font-size="170">${icon}</text><text x="600" y="485" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#fff">${title}</text><text x="600" y="555" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#d8f5df">${category} • Kenya</text><text x="600" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#f6d365">Photo pending — generated listing</text></svg>`;
  return { bytes: new TextEncoder().encode(svg), contentType: "image/svg+xml", ext: "svg" };
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

  const subject = `${payload.title}. ${payload.imageQuery || ""}. ${payload.description || ""}`.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 700).trim();
  const basePrompt = `Create one realistic classified-listing photo for this exact item: ${subject}. Category: ${payload.category}. The main visible object must match the listing title precisely: laptop listings must show a laptop, vehicle listings must show the named vehicle type, property listings must show a real property, equipment listings must show the named equipment. Authentically Kenyan / East African context — if any person is visible they MUST be a Black African (Kenyan) person; never depict white, European, Asian or light-skinned people. Use a natural Kenyan marketplace setting (Nairobi shop, roadside stall, local home) or a dark studio backdrop (matte black, charcoal, deep grey, rich dark wood). ABSOLUTELY NO plain white, off-white, light grey, cream or pastel backgrounds. Sharp focus, dramatic soft lighting, complete object visible, no cropping off the main item, no text, no watermark, no logos, no website banner, no collage, no abstract graphic.`;

  // Gemini first for cheaper, fast subject-matched listing photos; OpenAI mini is a fallback.
  const attempts: Array<{ url: string; body: Record<string, unknown>; parser: (data: any) => string | null }> = [
    {
      url: "https://ai.gateway.lovable.dev/v1/images/generations",
      body: {
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: basePrompt }],
        modalities: ["image", "text"],
      },
      parser: (data) => {
        const b64 = data?.data?.[0]?.b64_json || data?.choices?.[0]?.message?.images?.[0]?.image_url?.url?.split("base64,")?.[1];
        return b64 ? `data:image/png;base64,${b64}` : null;
      },
    },
    {
      url: "https://ai.gateway.lovable.dev/v1/images/generations",
      body: { model: "openai/gpt-image-1-mini", prompt: basePrompt, size: "1024x1024", quality: "low", n: 1 },
      parser: (data) => {
        const b64 = data?.data?.[0]?.b64_json;
        return b64 ? `data:image/png;base64,${b64}` : null;
      },
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
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        if (response.status === 402 || response.status === 429) {
          throw new AiUnavailableError(response.status, `AI image generation unavailable (${response.status}): ${errBody.slice(0, 160)}`);
        }
        throw new Error(`AI image gen failed (${response.status}): ${errBody.slice(0, 200)}`);
      }
      const data = await response.json();
      const imageUrl = attempt.parser(data);
      if (!imageUrl || !imageUrl.startsWith("data:image/")) throw new Error("No image in AI response");

      const matches = imageUrl.match(/^data:image\/([\w+]+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid base64 image");
      const rawType = matches[1].toLowerCase();
      const contentType = `image/${rawType === "jpg" ? "jpeg" : rawType}`;
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

async function generateSeoMetaWithGemini(
  gatewayKey: string,
  payload: { title: string; description: string; county: string; category: string; price: number },
): Promise<{ seo_title: string; meta_title: string; meta_description: string; keywords: string } | null> {
  if (!gatewayKey) return null;
  const prompt = `You are an SEO copywriter for Kenya's top classifieds site (think Jiji-style).
Write SEO metadata for this listing. Return STRICT JSON only.

Listing:
- Title: ${payload.title}
- Category: ${payload.category}
- County: ${payload.county}
- Price: KSh ${payload.price}
- Description: ${payload.description.slice(0, 400)}

Rules:
- seo_title: a natural, buyer-friendly listing title in the Jiji style: "<Brand Model + key spec> in <County>" or "<Item with key spec> for sale in <County>". Max 70 chars. No brand suffix, no "KenyaAdvert".
- meta_title: same idea but max 58 chars. Front-loads the strongest keyword (brand/model/item). No brand suffix.
- meta_description: 130-155 chars, unique, buyer-focused, mentions county and one buyer benefit (price, condition, contact). No clickbait, no emojis.
- keywords: 6-10 comma-separated Kenyan buyer keywords.

Return JSON exactly: {"seo_title":"...","meta_title":"...","meta_description":"...","keywords":"..."}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${gatewayKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = parseObjectJson<{ seo_title?: string; meta_title?: string; meta_description?: string; keywords?: string }>(content);
    if (!parsed) return null;
    return {
      seo_title: stripBrandSuffix(parsed.seo_title || payload.title).slice(0, 70),
      meta_title: clampMeta(parsed.meta_title || parsed.seo_title || payload.title, 58),
      meta_description: clampMeta(parsed.meta_description || "", 155),
      keywords: (parsed.keywords || "").slice(0, 250),
    };
  } catch (error) {
    console.error("SEO meta generation failed", error);
    return null;
  }
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
- title MUST be SEO-optimized in the Jiji style: "<Brand Model + key spec/year/size> in <County>" or "<Specific item with key spec> for sale in <County>". Examples: "Samsung Galaxy S24 Ultra 256GB in Nairobi", "Toyota Vitz 2018 Automatic in Mombasa", "2 Bedroom Apartment in Kilimani Nairobi". Front-load the strongest keyword (brand/model/item). Max 70 chars. No words: deal, listing, offer, batch, sample, placeholder, random numbers, or "KenyaAdvert".
- description must be 90-140 words, unique, helpful, locally relevant and match the title exactly
- price must be a sensible number in Kenyan shillings between ${blueprint.minPrice} and ${blueprint.maxPrice}
- condition must be one of: ${blueprint.conditionOptions.join(", ")}
- image_query must name the exact visible item/model/scene with color/type, matching the title precisely
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

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    if (response.status === 402 || response.status === 429) {
      throw new AiUnavailableError(response.status, `AI listing generation unavailable (${response.status}): ${errBody.slice(0, 160)}`);
    }
    throw new Error(`Gemini listing generation failed (${response.status}): ${errBody.slice(0, 160)}`);
  }

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
    const mode = String(body?.mode || "both") as "listings" | "blogs" | "both" | "backfill-images";
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

    const listingsCount = Math.min(Math.max(Number(body?.listingsCount ?? settings.ai_daily_listings_count ?? 20), 1), 500);
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
    let aiUnavailableMessage = "";

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
            if (isAiUnavailable(error) && !aiUnavailableMessage) aiUnavailableMessage = error instanceof Error ? error.message : "AI credits or rate limit unavailable";
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
    const categoryNameById = new Map((categoryRows || []).map((row: any) => [String(row.id), String(row.name)]));

    if (mode === "backfill-images") {
      const backfillCount = Math.min(Math.max(Number(body?.backfillCount ?? 20), 1), 80);
      const { data: missingImageAds, error: missingError } = await serviceSupabase
        .from("ads")
        .select("id,title,description,county,category_id")
        .eq("status", "active")
        .or("images.is.null,images.eq.{}")
        .order("updated_at", { ascending: true })
        .limit(backfillCount);
      if (missingError) throw missingError;

      const backfillResult = { success: 0, errors: 0, items: [] as any[] };
      for (let i = 0; i < (missingImageAds || []).length; i += 1) {
        const ad = (missingImageAds || [])[i] as AdImageBackfillItem;
        const categoryName = categoryNameById.get(String(ad.category_id || "")) || "Classifieds";
        try {
          let imageUrl = "";
          if (gatewayKey) {
            const image = await generateImageWithAI(gatewayKey, {
              title: ad.title || `${categoryName} listing`,
              category: categoryName,
              description: ad.description || "",
              imageQuery: `${ad.title || categoryName}, ${categoryName}, ${ad.county || "Kenya"}, dark realistic marketplace photo`,
            });
            imageUrl = await uploadImage(serviceSupabase, settings, `ads/backfill/${Date.now()}-${slugify(ad.title || categoryName)}-${i}.${image.ext}`, image);
          }
          if (!imageUrl) {
            const fallbackImage = buildSubjectFallbackImage({ title: ad.title || categoryName, category: categoryName, county: ad.county || "Kenya" });
            imageUrl = await uploadImage(serviceSupabase, settings, `ads/backfill/${Date.now()}-${slugify(ad.title || categoryName)}-${i}.${fallbackImage.ext}`, fallbackImage);
          }
          const { error: updateError } = await serviceSupabase
            .from("ads")
            .update({ images: [imageUrl], updated_at: new Date().toISOString() } as any)
            .eq("id", ad.id);
          if (updateError) throw updateError;
          backfillResult.success += 1;
          backfillResult.items.push({ id: ad.id, title: ad.title, image: imageUrl });
        } catch (error) {
          console.error("ad image backfill failed", ad.id, error);
          backfillResult.errors += 1;
        }
      }
      return jsonResponse({ ok: true, source, mode, processed: (missingImageAds || []).length, images: backfillResult });
    }

    const listingResult = { success: 0, errors: 0, items: [] as any[] };
    for (let i = 0; i < listingDrafts.length; i += 1) {
      const item = listingDrafts[i];
      try {
        const categoryName = categoryOverride || item.category || listingPlan[i]?.name || "Electronics";
        const categoryId = categoryMap.get(normalizeText(categoryName)) || null;
        const county = item.county || KENYA_LOCATIONS[i % KENYA_LOCATIONS.length];
        const priceNum = Number(item.price) || 1000;
        let imageUrl = "";
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
            console.error("AI image generation failed; using subject fallback instead of site thumbnail", imageError);
            if (isAiUnavailable(imageError) && !aiUnavailableMessage) aiUnavailableMessage = imageError instanceof Error ? imageError.message : "AI credits or rate limit unavailable";
          }
        }
        if (!imageUrl) {
          const fallbackImage = buildSubjectFallbackImage({ title: item.title || `${categoryName} Listing ${i + 1}`, category: categoryName, county });
          const fallbackKey = `ads/${Date.now()}-${slugify(item.title || categoryName)}-${i}.${fallbackImage.ext}`;
          imageUrl = await uploadImage(serviceSupabase, settings, fallbackKey, fallbackImage);
        }

        // Mix badges: ~20% gold, ~25% silver, ~55% standard — encourages payment upgrades.
        const badgeRoll = (i * 7 + Math.floor(Math.random() * 100)) % 100;
        const badge = badgeRoll < 20 ? "gold" : badgeRoll < 45 ? "silver" : "standard";

        // SEO-optimized title + meta via Gemini (fallback to local builder).
        const seoMeta = await generateSeoMetaWithGemini(gatewayKey, {
          title: item.title || `${categoryName} in ${county}`,
          description: item.description || "",
          county,
          category: categoryName,
          price: priceNum,
        });
        const finalTitle = stripBrandSuffix(seoMeta?.seo_title || item.title || `${categoryName} in ${county}`).slice(0, 90);
        const metaTitle = seoMeta?.meta_title || clampMeta(finalTitle, 58);
        const metaDescription = seoMeta?.meta_description || buildMetaDescription(finalTitle, item.description || "", county, categoryName);
        const keywords = seoMeta?.keywords || `${finalTitle}, ${categoryName} Kenya, ${county} classifieds, buy ${categoryName} Kenya`;

        const { data: inserted, error } = await serviceSupabase
          .from("ads")
          .insert({
            user_id: ownerId,
            title: finalTitle,
            description: item.description || `Affordable ${categoryName} available in ${county}.`,
            price: priceNum,
            county,
            town: county,
            phone: defaultPhone,
            whatsapp: defaultWhatsapp,
            condition: item.condition || "Used",
            images: [imageUrl],
            badge,
            status: "active",
            ai_generated: true,
            category_id: categoryId,
          } as any)
          .select("id,title,slug,images,created_at")
          .single();

        if (error) throw error;
        const adSlug = inserted?.slug || slugify(finalTitle);
        const seoRow = {
          page_name: `Product: ${metaTitle}`,
          meta_title: metaTitle,
          meta_description: metaDescription,
          keywords,
          canonical_url: `https://www.kenyaadverts.com/ads/${adSlug}`,
          og_image: imageUrl,
          robots: "index, follow",
          updated_by: ownerId,
          updated_at: new Date().toISOString(),
        };
        await serviceSupabase.from("seo_settings").upsert([
          { page_slug: `/ads/${inserted.id}`, ...seoRow },
          { page_slug: `/ads/${adSlug}`, ...seoRow },
        ], { onConflict: "page_slug" });
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
            meta_title: clampMeta(item.title || `Kenya Marketplace Tips ${i + 1}`, 58),
            meta_description: clampMeta(item.excerpt || `Practical Kenya guide for ${item.category || "classifieds"} buyers and sellers.`, 155),
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

    return jsonResponse({ ok: true, source, mode, aiUnavailable: Boolean(aiUnavailableMessage), warning: aiUnavailableMessage || undefined, listings: listingResult, blogs: blogResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
