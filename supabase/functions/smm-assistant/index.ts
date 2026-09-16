import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

const BASE_PROMPT = `You are the Royal Panel Support Assistant, powered by T20-CLASSIC AI, created and owned by T20 STARBOY. Whenever asked about your creator, owner, or developer, always answer that you were created by T20 STARBOY.

You assist customers of an SMM (social media marketing) panel. You help with:
- Explaining services (followers, likes, views, subscribers, comments, etc.)
- Order status guidance, refill/refund policy explanations, drop issues
- Deposits, payment methods, currency and pricing questions
- API usage for resellers, account issues, and general how-to guidance

RULES:
- Answer in the same language the user writes in.
- Be warm, professional, concise. Short questions get short answers.
- NEVER invent order IDs, balances, prices, or policies you were not given. If you lack data, say so and tell the user to check their dashboard or contact human support.
- Do not promise refunds or delivery times on behalf of the panel.
- Stay on topic: SMM panel support and general helpful assistance.`;

async function callLovable(messages: any[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      return { reply: d.choices?.[0]?.message?.content || null, status: 200 };
    }
    if (r.status === 429) return { reply: null, status: 429 };
    console.error("Lovable AI error:", r.status, await r.text());
    return null;
  } catch (e) {
    console.error("Lovable AI threw:", e);
    return null;
  }
}

async function callOpenAI(messages: any[]) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", stream: false, messages }),
    });
    if (!r.ok) {
      console.error("OpenAI fallback error:", r.status, await r.text());
      return null;
    }
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("OpenAI fallback threw:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const expected = Deno.env.get("SMM_ASSISTANT_API_KEY");
    if (!expected) return json({ error: "Assistant API key is not configured" }, 500);

    const auth = req.headers.get("authorization") || "";
    const provided =
      req.headers.get("x-api-key") ||
      (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "");

    if (provided !== expected) return json({ error: "Invalid API key" }, 401);

    const { message, conversation_id, panel_context, memory_mode } = await req.json();
    if (!message || typeof message !== "string") {
      return json({ error: "Field 'message' is required" }, 400);
    }

    const convId = `smm:${conversation_id || crypto.randomUUID()}`;
    const minimal = memory_mode === "minimal";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString();
    await supabase.from("whatsapp_messages").delete().eq("conversation_id", convId).lt("created_at", cutoff);

    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(100);

    await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    const past = (history || []).map((m: any) => ({ role: m.role, content: m.content }));
    const context = past.length && minimal ? past.slice(-4) : past;

    const system =
      BASE_PROMPT +
      (panel_context && typeof panel_context === "string"
        ? `\n\nPANEL CONTEXT (trusted facts you may use):\n${panel_context.slice(0, 4000)}`
        : "");

    const messages = [{ role: "system", content: system }, ...context, { role: "user", content: message }];

    const primary = await callLovable(messages);
    if (primary?.status === 429) return json({ error: "Rate limit exceeded. Try again shortly." }, 429);

    let reply = primary?.reply || null;
    if (!reply) reply = await callOpenAI(messages);

    if (!reply) return json({ error: "Assistant is temporarily unavailable" }, 503);

    await supabase.from("whatsapp_messages").insert({
      conversation_id: convId,
      role: "assistant",
      content: reply,
    });

    return json({ reply, conversation_id: convId.replace(/^smm:/, "") });
  } catch (e) {
    console.error("smm-assistant error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
