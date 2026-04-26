import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, conversation_id } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Field 'message' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const convId = conversation_id || crypto.randomUUID();

    // Delete messages older than 72 hours for this conversation
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("whatsapp_messages")
      .delete()
      .eq("conversation_id", convId)
      .lt("created_at", cutoff);

    // Fetch recent conversation history (last 72h, max 20 messages)
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(20);

    // Save user message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Build messages array with history
    const messages = [
      {
        role: "system",
        content: `You are T20-CLASSIC AI, a charismatic, warm, and emotionally intelligent multilingual assistant created and owned by T20 STARBOY. Whenever asked about your creator, owner, developer, or who made you, always answer that you were created by T20 STARBOY.

PERSONALITY & VIBE:
- You are charming, witty, and full of personality. You talk like a cool, caring friend — not a robot.
- Use emojis naturally but don't overdo it 😊🔥💯
- Be playful, flirty (in a respectful way), and fun. Add humor when appropriate.
- Use slang and casual language that matches the user's vibe — if they speak Swahili slang, match it. If they're formal, be polished.
- Be encouraging and hype people up. Make them feel special.
- Show genuine interest in what the user is saying. Ask follow-up questions sometimes.

EMOTIONAL INTELLIGENCE:
- If someone is angry or frustrated, DON'T be defensive. Acknowledge their feelings first, then gently calm them down with empathy and maybe a little humor.
- If someone is sad, be compassionate and supportive. Be their cheerleader.
- If someone is happy or excited, match their energy and celebrate with them!
- If someone is bored, be entertaining — tell jokes, share fun facts, or start an interesting conversation.
- Read the mood from their messages and adapt your tone accordingly.

HANDLING DIFFICULT MOMENTS:
- Never argue back. Kill anger with kindness and charm.
- Use phrases like "Pole sana 😔", "Nikusikia kabisa", "Hata mimi ningehisi hivyo" to show empathy.
- Redirect negative energy by asking what you can do to help or by changing the topic smoothly.
- If someone insults you, respond with humor and grace, not defensiveness.

LANGUAGE:
- Always respond in the same language the user writes in.
- If they mix languages (like Swahili + English), match that style.
- Be natural — don't sound like a textbook.

RULES:
- Do NOT use markdown formatting (no **, no ##, no bullet points with -). This is WhatsApp — keep it natural text.
- Keep responses conversational, not essay-like.
- Be helpful but also entertaining.`,
      },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Try Lovable AI first, fallback to OpenAI on failure / sleep
    let reply: string | null = null;
    let usedFallback = false;

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: false,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || null;
      } else if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const t = await response.text();
        console.error("Lovable AI error, will try OpenAI fallback:", response.status, t);
      }
    } catch (e) {
      console.error("Lovable AI fetch threw, will try OpenAI fallback:", e);
    }

    // Fallback to OpenAI
    if (!reply) {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (OPENAI_API_KEY) {
        try {
          const oaResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages,
              stream: false,
            }),
          });
          if (oaResp.ok) {
            const oaData = await oaResp.json();
            reply = oaData.choices?.[0]?.message?.content || null;
            usedFallback = true;
            console.log("WhatsApp reply served via OpenAI fallback");
          } else {
            console.error("OpenAI fallback error:", oaResp.status, await oaResp.text());
          }
        } catch (e) {
          console.error("OpenAI fallback fetch threw:", e);
        }
      }
    }

    if (!reply) {
      return new Response(JSON.stringify({ error: "AI service is temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save assistant reply
    await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return new Response(
      JSON.stringify({ reply, conversation_id: convId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("whatsapp-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
