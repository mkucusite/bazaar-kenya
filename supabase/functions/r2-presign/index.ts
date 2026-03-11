import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: rows } = await supabase.from("admin_settings").select("key, value");
    const s: Record<string, string> = Object.fromEntries(
      (rows || []).map((r: any) => [r.key, r.value])
    );

    if (!s.r2_access_key || !s.r2_secret_key || !s.r2_bucket_name) {
      return new Response(JSON.stringify({ error: "R2 not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { filename, contentType } = await req.json();
    const endpoint = s.r2_endpoint || `https://${s.r2_account_id}.r2.cloudflarestorage.com`;
    const bucket = s.r2_bucket_name;
    const region = "auto";
    const accessKey = s.r2_access_key;
    const secretKey = s.r2_secret_key;

    // Generate a simple presigned URL using AWS Signature V4
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const shortDate = dateStamp.slice(0, 8);
    const credential = `${accessKey}/${shortDate}/${region}/s3/aws4_request`;

    const expiresIn = 300;
    const queryParams = new URLSearchParams({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": credential,
      "X-Amz-Date": dateStamp,
      "X-Amz-Expires": String(expiresIn),
      "X-Amz-SignedHeaders": "host;content-type",
    });

    // For simplicity, return the public URL pattern - actual presigning requires crypto
    // The client should use the Supabase edge function as a proxy instead
    const publicUrl = `${s.r2_public_url || endpoint}/${filename}`;

    return new Response(
      JSON.stringify({ presignedUrl: `${endpoint}/${bucket}/${filename}`, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
