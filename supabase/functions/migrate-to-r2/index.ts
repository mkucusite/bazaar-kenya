import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

    // Load R2 settings
    const { data: rows } = await supabase.from("admin_settings").select("key, value");
    const settings: Record<string, string> = Object.fromEntries(
      (rows || []).map((r: any) => [r.key, r.value ?? ""])
    );

    if (!settings.r2_access_key || !settings.r2_secret_key || !settings.r2_bucket_name) {
      return jsonResponse({ error: "R2 not configured" }, 400);
    }

    const endpoint = `https://${settings.r2_account_id}.r2.cloudflarestorage.com`;
    const bucket = settings.r2_bucket_name;
    const r2PublicUrl = settings.r2_public_url || `https://cdn.kenyaadverts.co.ke`;

    const aws = new AwsClient({
      accessKeyId: settings.r2_access_key,
      secretAccessKey: settings.r2_secret_key,
      service: "s3",
      region: "auto",
    });

    // Get body params - offset for pagination
    const body = await req.json().catch(() => ({}));
    const offset = Number(body?.offset || 0);
    const batchSize = 20;

    // Fetch ads with Supabase image URLs
    const { data: ads, error: adsError } = await supabase
      .from("ads")
      .select("id, images")
      .not("images", "is", null)
      .range(offset, offset + batchSize - 1);

    if (adsError) return jsonResponse({ error: adsError.message }, 500);
    if (!ads || ads.length === 0) return jsonResponse({ done: true, message: "All ads processed!" });

    const results = [];

    for (const ad of ads) {
      const images: string[] = ad.images || [];
      const newImages: string[] = [];
      let changed = false;

      for (const imageUrl of images) {
        // Skip if already on R2/CDN
        if (imageUrl.includes("r2.dev") || imageUrl.includes("cdn.kenyaadverts.co.ke")) {
          newImages.push(imageUrl);
          continue;
        }

        try {
          // Download from Supabase storage
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) {
            newImages.push(imageUrl); // keep original if download fails
            continue;
          }

          const imgBuffer = await imgRes.arrayBuffer();
          const contentType = imgRes.headers.get("Content-Type") || "image/webp";

          // Extract filename from URL
          const urlParts = imageUrl.split("/");
          const filename = urlParts[urlParts.length - 1];
          const r2Key = `ads/${filename}`;
          const r2Url = `${endpoint}/${bucket}/${r2Key}`;

          // Upload to R2
          const uploadReq = new Request(r2Url, {
            method: "PUT",
            body: imgBuffer,
            headers: { "Content-Type": contentType },
          });

          const signedReq = await aws.sign(uploadReq);
          const uploadRes = await fetch(signedReq);

          if (uploadRes.ok) {
            newImages.push(`${r2PublicUrl}/${r2Key}`);
            changed = true;
          } else {
            newImages.push(imageUrl); // keep original if upload fails
          }
        } catch {
          newImages.push(imageUrl); // keep original on error
        }
      }

      // Update ad with new R2 image URLs
      if (changed) {
        await supabase.from("ads").update({ images: newImages }).eq("id", ad.id);
        results.push({ id: ad.id, status: "migrated", count: newImages.length });
      } else {
        results.push({ id: ad.id, status: "skipped" });
      }
    }

    return jsonResponse({
      processed: ads.length,
      nextOffset: offset + batchSize,
      results,
      done: ads.length < batchSize,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
