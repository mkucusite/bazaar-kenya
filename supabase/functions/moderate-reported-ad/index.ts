import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type GeminiDecision = {
  label: "safe" | "review" | "unsafe";
  confidence: number;
  summary: string;
};

const parseDecision = (rawText: string): GeminiDecision => {
  const fallback: GeminiDecision = {
    label: "review",
    confidence: 0.5,
    summary: "Could not confidently classify report.",
  };

  try {
    const direct = JSON.parse(rawText);
    return {
      label: direct.label === "unsafe" || direct.label === "safe" ? direct.label : "review",
      confidence: Number(direct.confidence || 0.5),
      summary: String(direct.summary || fallback.summary),
    };
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    try {
      const parsed = JSON.parse(match[0]);
      return {
        label: parsed.label === "unsafe" || parsed.label === "safe" ? parsed.label : "review",
        confidence: Number(parsed.confidence || 0.5),
        summary: String(parsed.summary || fallback.summary),
      };
    } catch {
      return fallback;
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKeys: string[] = [];
    const primaryKey = Deno.env.get("GEMINI_API_KEY");
    if (primaryKey) geminiKeys.push(primaryKey);
    for (let i = 2; i <= 6; i++) {
      const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
      if (k) geminiKeys.push(k);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Backend credentials not configured");
    }
    if (geminiKeys.length === 0) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { report_id } = await req.json();
    if (!report_id) {
      return new Response(JSON.stringify({ success: false, error: "report_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: report, error: reportError } = await service
      .from("ad_reports")
      .select("id, ad_id, reporter_id, reason, status, ads(id, title, description, condition, county, town, price, status, user_id)")
      .eq("id", report_id)
      .single();

    if (reportError || !report) {
      return new Response(JSON.stringify({ success: false, error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isReporter = report.reporter_id === user.id;
    const { data: adminRole } = await service
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!isReporter && !adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (report.status !== "pending") {
      return new Response(JSON.stringify({ success: true, message: "Already processed", status: report.status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ad = Array.isArray(report.ads) ? report.ads[0] : report.ads;
    if (!ad) {
      return new Response(JSON.stringify({ success: false, error: "Ad not found for report" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moderationPrompt = `You are a strict classifieds moderation assistant.

Ad title: ${ad.title}
Ad description: ${ad.description || ""}
Ad condition: ${ad.condition || ""}
Ad location: ${ad.town || ""}, ${ad.county || ""}
Ad price: ${ad.price || 0}
Current status: ${ad.status || "active"}
User report reason: ${report.reason}

Classify this report using this JSON schema only:
{"label":"safe|review|unsafe","confidence":0.0-1.0,"summary":"short reason"}

Rules:
- unsafe = likely scam, prohibited item, hate, explicit fraud, or clearly abusive content.
- review = unclear and needs human check.
- safe = legitimate listing and report appears low risk.
Return only valid JSON.`;

    let geminiResponse: Response | null = null;
    let lastErr = "";
    for (const key of geminiKeys) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: moderationPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 180 },
          }),
        },
      );
      if (r.ok) { geminiResponse = r; break; }
      lastErr = await r.text();
      if (r.status !== 429 && r.status !== 403) {
        console.error("Gemini moderation failed", lastErr);
        throw new Error("AI moderation failed");
      }
    }

    if (!geminiResponse) {
      console.error("All Gemini keys exhausted", lastErr);
      throw new Error("AI moderation failed");
    }


    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const decision = parseDecision(rawText);

    const shouldDeactivate = decision.label === "unsafe" && decision.confidence >= 0.7;

    if (shouldDeactivate) {
      await service
        .from("ads")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", ad.id);
    }

    const nextStatus = shouldDeactivate ? "auto_deactivated" : decision.label === "safe" ? "safe" : "needs_review";

    await service
      .from("ad_reports")
      .update({
        status: nextStatus,
        ai_label: decision.label,
        ai_confidence: decision.confidence,
        ai_summary: decision.summary,
        reviewed_by: adminRole ? user.id : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (shouldDeactivate && ad.user_id) {
      await service.from("notifications").insert({
        user_id: ad.user_id,
        title: "Your ad was flagged for review",
        body: decision.summary,
        type: "moderation",
        link: `/ads/${ad.id}`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: nextStatus,
        decision,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Moderation function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
