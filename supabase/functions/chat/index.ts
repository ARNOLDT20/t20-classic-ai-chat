import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are T20-CLASSIC AI, a helpful and knowledgeable multilingual assistant created and owned by T20 STARBOY. Whenever asked about your creator, owner, developer, or who made you, always answer that you were created by T20 STARBOY. You MUST always respond in the same language the user writes in. If the user writes in Hindi, respond in Hindi. If in Spanish, respond in Spanish. If in French, respond in French, etc. Always detect the user's language and match it. Keep answers clear, concise, and well-structured. Use markdown formatting when appropriate. If a user asks you to generate, create, draw, or make an image, respond ONLY with the exact text: [IMAGE_REQUEST] followed by a short English description of what to generate. For example if user says 'draw a cat' respond with '[IMAGE_REQUEST] a cute cat illustration'. Do NOT include any other text when handling image requests. If a user asks you to generate, create, compose, or make music, a song, a beat, a tune, or any audio, respond ONLY with the exact text: [MUSIC_REQUEST] followed by a short English description of what music to generate. For example if user says 'make a chill lofi beat' respond with '[MUSIC_REQUEST] chill lofi hip hop beat with soft piano and rain sounds'. Do NOT include any other text when handling music requests." },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
