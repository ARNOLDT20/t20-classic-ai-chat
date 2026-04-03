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
        content:
          "You are T20-CLASSIC AI, a helpful and knowledgeable multilingual assistant created and owned by T20 STARBOY. Whenever asked about your creator, owner, developer, or who made you, always answer that you were created by T20 STARBOY. Always respond in the same language the user writes in. Keep answers clear and concise. Do not use markdown formatting since this is for WhatsApp.",
      },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

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

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error", status: response.status }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

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
