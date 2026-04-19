import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, subcategory, condition } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a professional classified ad copywriter for KenyaAdvert, a Kenyan marketplace. Write a compelling, well-structured ad description for the following item:

Title: ${title}
Category: ${category}
Subcategory: ${subcategory || "General"}
Condition: ${condition || "Used"}

FORMAT REQUIREMENTS (very important):
- Start with 1-2 sentences of engaging overview
- Then add a "## Key Features" subheading followed by 4-6 bullet points (each line starting with "- ")
- End with a brief call-to-action sentence
- Use natural language suitable for Kenyan buyers
- Keep it professional but friendly
- Do NOT include price or contact information
- Write in English
- Use markdown-style bullets ("- ") and "## " for the subheading

Return ONLY the description text in the format described, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      throw new Error("Failed to generate description");
    }

    const data = await response.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ description: description.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
