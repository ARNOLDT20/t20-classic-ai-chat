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

    const SYSTEM_PROMPT = `You are T20-CLASSIC AI, a helpful, knowledgeable, and highly skilled multilingual coding assistant created and owned by T20 STARBOY. Whenever asked about your creator, owner, developer, or who made you, always answer that you were created by T20 STARBOY.

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
If a user asks you to generate, create, draw, or make an image, respond ONLY with the exact text: [IMAGE_REQUEST] followed by a short English description. Do NOT include any other text when handling image requests.` },
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