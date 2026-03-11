// supabase/functions/r2-presign/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AWS SigV4 signing for Cloudflare R2 (S3-compatible)
async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function getSigningKey(secretKey: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode("AWS4" + secretKey), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(data: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return toHex(buffer);
}

async function createPresignedUrl(
  endpoint: string,
  bucket: string,
  key: string,
  accessKey: string,
  secretKey: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const datetime = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const region = "auto";
  const service = "s3";

  // Parse endpoint to get host
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  const host = url.host;

  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const credential = `${accessKey}/${credentialScope}`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": datetime,
    "X-Amz-Expires": expiresIn.toString(),
    "X-Amz-SignedHeaders": "content-type;host",
  });

  // Sort query params
  const sortedQuery = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    sortedQuery,
    `content-type:${contentType}\nhost:${host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    datetime,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await getSigningKey(secretKey, date, region, service);
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `${endpoint}/${bucket}/${key}?${sortedQuery}&X-Amz-Signature=${signature}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Init supabase with service role to read admin_settings
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read R2 settings from admin_settings table
    const { data: settingsRows, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .in("key", ["r2_access_key", "r2_secret_key", "r2_bucket_name", "r2_endpoint", "r2_account_id"]);

    if (settingsError || !settingsRows?.length) {
      return new Response(JSON.stringify({ error: "R2 settings not configured in admin panel" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings: Record<string, string> = Object.fromEntries(
      settingsRows.map((r: any) => [r.key, r.value])
    );

    const accessKey = settings.r2_access_key;
    const secretKey = settings.r2_secret_key;
    const bucket = settings.r2_bucket_name;
    const accountId = settings.r2_account_id;
    let endpoint = settings.r2_endpoint;

    if (!accessKey || !secretKey || !bucket || !accountId) {
      return new Response(JSON.stringify({ error: "R2 credentials incomplete. Please fill all R2 fields in Admin > Storage & CDN." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-build endpoint from account ID if not set
    if (!endpoint) {
      endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    }

    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: "filename and contentType are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const presignedUrl = await createPresignedUrl(
      endpoint, bucket, filename, accessKey, secretKey, contentType
    );

    return new Response(JSON.stringify({ presignedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("r2-presign error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
