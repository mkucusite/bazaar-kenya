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
    const { title, category, subcategory, condition, description, targetWords } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a professional classified ad copywriter for a Kenyan marketplace. Expand or write a compelling, well-structured ad description for the following item:

Title: ${title}
Category: ${category}
Subcategory: ${subcategory || "General"}
Condition: ${condition || "Used"}
Seller draft: ${description || ""}

FORMAT REQUIREMENTS (very important — follow exactly):
- Start with 1-2 sentences of engaging overview describing the item's value to a Kenyan buyer.
- Then add a "## Key Features" subheading followed by 4-6 bullet points (each line starting with "- ").
- Then add a "## Specifications" subheading followed by 4-8 spec lines in the format "Label: Value" (one per line, no bullet markers — these will be rendered as a clean specs table).
- End with a brief, friendly call-to-action sentence inviting the buyer to call or WhatsApp.
- Target ${Math.min(Math.max(Number(targetWords) || 110, 80), 150)} words total. If the seller draft is short, preserve its meaning and elaborate naturally.
- Use natural Kenyan English (KSh for prices, M-Pesa, mention Nairobi/county if relevant).
- Be specific — use realistic specs based on the title and category.
- Do NOT include the seller's price or contact information.
- Do NOT mention KenyaAdvert or any marketplace brand.
- Do NOT use placeholder text like "TBD" or "N/A".
- Use markdown markers exactly: "## " for subheadings and "- " for bullets.

Return ONLY the description text in the format described, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI is busy right now. Please try again in a few seconds." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Lovable AI gateway error:", response.status, errText);
      throw new Error("Failed to generate description");
    }

    const data = await response.json();
    const description: string = data?.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ description: description.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("generate-description error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
