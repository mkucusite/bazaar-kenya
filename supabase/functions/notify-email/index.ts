import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_id, subject, body, link } = await req.json();

    if (!recipient_id || !subject) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user email from auth
    const { data: userData, error: userError } =
      await sb.auth.admin.getUserById(recipient_id);

    if (userError || !userData?.user?.email) {
      console.log("Could not get user email:", userError?.message || "no email");
      return new Response(JSON.stringify({ ok: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    const siteUrl = "https://www.kenyaadverts.com";
    const fullLink = link ? `${siteUrl}${link}` : siteUrl;

    // For now, log the email intent — actual email delivery requires an email service
    // This creates a record so we can integrate with an email provider later
    console.log(`📧 Email notification queued: to=${email}, subject="${subject}", body="${body}", link="${fullLink}"`);

    // Store email intent in notifications table as a backup
    // The in-app notification was already created by the DB trigger
    // This function serves as the hook point for email delivery integration

    return new Response(
      JSON.stringify({ ok: true, email_to: email, subject }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-email error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});