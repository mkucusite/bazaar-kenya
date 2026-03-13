import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: rows, error: settingsError } = await supabase.from("admin_settings").select("key, value");
    if (settingsError) {
      return jsonResponse({ error: settingsError.message }, 500);
    }

    const settings: Record<string, string> = Object.fromEntries(
      (rows || []).map((row: any) => [row.key, row.value ?? ""]),
    );

    if (!settings.r2_access_key || !settings.r2_secret_key || !settings.r2_bucket_name) {
      return jsonResponse({ error: "R2 not configured" }, 400);
    }

    const body = await req.json();
    const rawFilename = String(body?.filename || "").trim();
    const contentType = String(body?.contentType || "application/octet-stream").trim();

    if (!rawFilename) return jsonResponse({ error: "filename is required" }, 400);

    const safeFilename = rawFilename
      .replace(/[^a-zA-Z0-9._/-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-/]+|[-/]+$/g, "");

    if (!safeFilename) return jsonResponse({ error: "invalid filename" }, 400);

    const endpoint = trimTrailingSlash(
      settings.r2_endpoint || `https://${settings.r2_account_id}.r2.cloudflarestorage.com`,
    );
    const bucket = settings.r2_bucket_name;
    const objectUrl = `${endpoint}/${bucket}/${safeFilename}`;

    const aws = new AwsClient({
      accessKeyId: settings.r2_access_key,
      secretAccessKey: settings.r2_secret_key,
      service: "s3",
      region: "auto",
    });

    const signedRequest = await aws.sign(
      new Request(objectUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
      }),
      { aws: { signQuery: true, service: "s3", region: "auto" } },
    );

    const publicBase = trimTrailingSlash(settings.r2_public_url || `${endpoint}/${bucket}`);
    const publicUrl = `${publicBase}/${safeFilename}`;

    return jsonResponse({ presignedUrl: signedRequest.url, publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
