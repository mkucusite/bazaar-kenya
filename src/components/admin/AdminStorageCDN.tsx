import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secret), date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

async function uploadToR2(
  endpoint: string, bucket: string, key: string,
  accessKey: string, secretKey: string,
  body: ArrayBuffer, contentType: string
): Promise<Response> {
  const now = new Date();
  const datetime = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const date = datetime.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const url = `${endpoint}/${bucket}/${key}`;
  const host = new URL(url).host;
  const payloadHash = await sha256Hex(body);

  const headers: Record<string, string> = {
    "content-type": contentType,
    "host": host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": datetime,
  };

  const sortedKeys = Object.keys(headers).sort();
  const signedHeaders = sortedKeys.join(";");
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
  const canonicalRequest = ["PUT", `/${bucket}/${key}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", datetime, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
  const signingKey = await getSigningKey(secretKey, date, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method: "PUT",
    headers: { ...headers, Authorization: authHeader },
    body,
  });
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify auth header present
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized: missing Authorization header" }, 401);

    // Init supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load R2 credentials from admin_settings
    const { data: rows, error: dbError } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["r2_access_key", "r2_secret_key", "r2_bucket_name", "r2_endpoint", "r2_account_id", "r2_public_url"]);

    if (dbError) return jsonResponse({ error: `DB error: ${dbError.message}` }, 500);

    const s: Record<string, string> = Object.fromEntries((rows || []).map((r: any) => [r.key, r.value]));

    if (!s.r2_access_key || !s.r2_secret_key || !s.r2_bucket_name) {
      return jsonResponse({ error: "R2 credentials not configured in Admin > Storage & CDN" }, 400);
    }

    const endpoint = (s.r2_endpoint || `https://${s.r2_account_id}.r2.cloudflarestorage.com`).replace(/\/$/, "");
    const publicUrl = (s.r2_public_url || "").replace(/\/$/, "");

    // Parse request body
    let body: { filename?: string; contentType?: string; fileBase64?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { filename, contentType, fileBase64 } = body;

    if (!filename || !contentType || !fileBase64) {
      return jsonResponse({
        error: `Missing required fields. Got: filename=${!!filename}, contentType=${!!contentType}, fileBase64=${!!fileBase64}`,
      }, 400);
    }

    // Decode base64 to buffer
    let fileBuffer: ArrayBuffer;
    try {
      fileBuffer = base64ToArrayBuffer(fileBase64);
    } catch (e: any) {
      return jsonResponse({ error: `Failed to decode base64: ${e.message}` }, 400);
    }

    if (!fileBuffer.byteLength) {
      return jsonResponse({ error: "File is empty (0 bytes)" }, 400);
    }

    // Upload to R2
    const r2Res = await uploadToR2(
      endpoint, s.r2_bucket_name, filename,
      s.r2_access_key, s.r2_secret_key,
      fileBuffer, contentType
    );

    if (!r2Res.ok) {
      const errBody = await r2Res.text();
      return jsonResponse({ error: `R2 rejected upload (${r2Res.status}): ${errBody}` }, 500);
    }

    // Build and return final URL
    const finalUrl = publicUrl
      ? `${publicUrl}/${filename}`
      : `${endpoint}/${s.r2_bucket_name}/${filename}`;

    return jsonResponse({ url: finalUrl });

  } catch (err: any) {
    console.error("r2-presign unhandled error:", err);
    return jsonResponse({ error: err.message || "Unknown server error" }, 500);
  }
});
