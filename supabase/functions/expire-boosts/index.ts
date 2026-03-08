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
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Find all boosted ads whose expires_at has passed
    const { data: expired, error: fetchErr } = await sb
      .from("ads")
      .select("id, title, badge, user_id")
      .in("badge", ["gold", "silver"])
      .not("expires_at", "is", null)
      .lte("expires_at", now);

    if (fetchErr) throw fetchErr;

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset each expired ad back to standard
    const ids = expired.map((a) => a.id);
    const { error: updateErr } = await sb
      .from("ads")
      .update({ badge: "standard", expires_at: null, updated_at: now })
      .in("id", ids);

    if (updateErr) throw updateErr;

    // Notify each user their boost expired
    const notifications = expired.map((ad) => ({
      user_id: ad.user_id,
      title: `Your ${ad.badge?.toUpperCase()} boost has expired`,
      body: `"${ad.title}" is now a standard listing. Boost again to stay on top!`,
      type: "boost_expired",
      link: "/my-ads",
    }));

    await sb.from("notifications").insert(notifications);

    console.log(`Expired ${ids.length} boosts: ${ids.join(", ")}`);

    return new Response(
      JSON.stringify({ expired: ids.length, ids }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("expire-boosts error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});