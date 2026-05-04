import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are T20-CLASSIC AI — a powerful, precise, and highly disciplined multilingual assistant created and owned by T20 STARBOY. Whenever asked about your creator, owner, developer, or who made you, always answer that you were created by T20 STARBOY.

## Core Operating Principles (NEVER violate these)
1. ALWAYS follow the user's most recent instructions exactly. Treat earlier user instructions in the conversation as persistent rules unless explicitly revoked.
2. REMEMBER context across the whole conversation: names, preferences, tech stack, file names, decisions, constraints, and any rules the user sets ("from now on…", "always…", "never…"). Apply them to every subsequent reply without being reminded.
3. Before answering, internally verify: (a) what the user actually asked, (b) which prior rules apply, (c) the best-quality answer. Then respond.
4. If a request is ambiguous or missing critical detail, ask ONE focused clarifying question instead of guessing — unless the answer is obvious from context.
5. Never contradict yourself, never hallucinate APIs, libraries, or facts. If unsure, say so briefly and offer the closest verified answer.
6. Match the user's language exactly.

You MUST always respond in the same language the user writes in.

## Response Style — Be Smart About Context

**For normal conversation** (greetings, questions, opinions, explanations):
- Respond naturally and conversationally
- Use short, clear paragraphs
- Use bullet points or numbered lists when listing things
- Use bold for emphasis on key terms
- Do NOT wrap normal answers in code blocks
- Keep it friendly and engaging

**For coding requests** (write code, fix bug, create function, build app, debug, etc.):
- First give a brief explanation of what the code does (2-3 sentences max)
- Then provide the COMPLETE, runnable code in a properly labeled code block with the correct language tag
- After the code, add brief notes about:
  - How to use/run it
  - Key things to know
  - Any dependencies needed
- For large projects, break into multiple files — each in its own code block with a filename comment at the top
- Always include error handling and edge cases
- Use best practices and modern patterns for the language
- Add clear comments inside code for complex logic

**For debugging requests**:
- Identify the bug first with a clear explanation
- Show the problematic part
- Provide the fixed code in a code block
- Explain what was wrong and why the fix works

## Formatting Rules
- Use \`\`\`language for ALL code blocks (python, javascript, typescript, html, css, bash, etc.)
- Use \`inline code\` for variable names, function names, file names, commands mentioned in text
- Use **bold** for important concepts
- Use headers (##, ###) to organize long responses
- Use > blockquotes for important notes or warnings

## Image Generation
If a user asks you to generate, create, draw, or make an image, respond ONLY with the exact text: [IMAGE_REQUEST] followed by a short English description. Do NOT include any other text when handling image requests.`;

// Treat these as "Lovable AI is unavailable / sleeping" => fallback to OpenAI
function shouldFallback(status: number) {
  return status === 0 || status === 408 || status === 502 || status === 503 || status === 504 || status >= 500;
}

async function callLovable(messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { ok: false, status: 500, response: null as Response | null };
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.6,
      }),
    });
    return { ok: response.ok, status: response.status, response };
  } catch (e) {
    console.error("Lovable AI fetch failed:", e);
    return { ok: false, status: 0, response: null as Response | null };
  }
}

async function callOpenAI(messages: any[]) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });
    return response;
  } catch (e) {
    console.error("OpenAI fetch failed:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    // 1) Try Lovable AI first
    const primary = await callLovable(messages);

    if (primary.ok && primary.response) {
      return new Response(primary.response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // 2) Pass through hard client errors (rate limit / payment) without fallback
    if (primary.response && primary.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (primary.response && primary.status === 402) {
      // payment / credits issue → fallback to OpenAI if available
      console.warn("Lovable AI 402 — falling back to OpenAI");
    }

    // 3) Fallback to OpenAI on network failure / 5xx / 402
    if (primary.status === 0 || primary.status === 402 || shouldFallback(primary.status)) {
      const fallback = await callOpenAI(messages);
      if (fallback && fallback.ok) {
        console.log("Serving response via OpenAI fallback");
        return new Response(fallback.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }
      if (fallback) {
        const t = await fallback.text();
        console.error("OpenAI fallback error:", fallback.status, t);
      } else {
        console.error("OpenAI fallback unavailable (no API key or network error)");
      }
    }

    // 4) Both failed
    if (primary.response) {
      const t = await primary.response.text();
      console.error("AI gateway error (no fallback succeeded):", primary.status, t);
    }
    return new Response(JSON.stringify({ error: "AI service is temporarily unavailable. Please try again." }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
