import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isImageGenerationRequest(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const imageKeywords = [
    "generate image", "create image", "make image", "draw", "generate a picture",
    "create a picture", "make a picture", "generate logo", "create logo", "make logo",
    "design logo", "generate art", "create art", "make art", "generate illustration",
    "create illustration", "visualize", "generate visual", "paint", "sketch",
    "generate an image", "create an image", "make an image", "generate a logo",
    "create a logo", "make a logo", "design a logo", "design image", "design an image",
  ];
  return imageKeywords.some((keyword) => lowerContent.includes(keyword));
}

function needsWebSearch(content: string): boolean {
  const lowerContent = content.toLowerCase();
  const searchKeywords = [
    "search", "look up", "find out", "what is the latest", "current", "today",
    "news", "recent", "2024", "2025", "who won", "what happened", "when did",
    "how much is", "price of", "weather", "stock", "score", "result", "latest",
    "update on", "tell me about", "what's happening", "trending", "who is", "where is",
    "why did", "how did", "statistics", "data on", "research", "study", "report",
    "announcement", "release", "launch",
  ];
  return searchKeywords.some((keyword) => lowerContent.includes(keyword));
}

async function performWebSearch(query: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "system", content: "You are a search assistant. Provide accurate, up-to-date information with sources. Be concise but comprehensive." },
          { role: "user", content: query },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        return_related_questions: false,
      }),
    });
    if (!response.ok) {
      console.error("Perplexity API error:", response.status, await response.text());
      return null;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Web search error:", error);
    return null;
  }
}

async function generateImage(prompt: string, apiKey: string): Promise<{ imageUrl: string; text: string }> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-1",
      prompt,
      size: "1024x1024",
      quality: Deno.env.get("OPENAI_IMAGE_QUALITY") || "auto",
      output_format: "png",
    }),
  });
  if (!response.ok) {
    console.error("OpenAI image API error:", response.status, await response.text());
    throw new Error("Image generation failed");
  }
  const data = await response.json();
  const image = data.data?.[0];
  const imageUrl = image?.url || (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : undefined);
  if (!imageUrl) throw new Error("No image generated");
  return { imageUrl, text: "Here's the image I generated for you:" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!openAiApiKey) throw new Error("OPENAI_API_KEY is not configured in Supabase Edge Function secrets");
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("Messages are required");

    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content || "";
    const isImageRequest = lastMessage?.isUser && isImageGenerationRequest(userContent);
    const needsSearch = lastMessage?.isUser && needsWebSearch(userContent);

    if (isImageRequest) {
      const imagePrompt = userContent
        .replace(/generate (an? )?image:?/gi, "")
        .replace(/create (an? )?image:?/gi, "")
        .replace(/make (an? )?image:?/gi, "")
        .replace(/draw:?/gi, "")
        .trim() || "A beautiful artistic illustration";
      const result = await generateImage(`${imagePrompt}. High quality, detailed, professional, 4K resolution.`, openAiApiKey);
      const responseText = `${result.text}\n\n![Generated Image](${result.imageUrl})`;
      const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content: responseText } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(sseData, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    let searchContext = "";
    if (needsSearch && perplexityApiKey) {
      const searchResult = await performWebSearch(userContent, perplexityApiKey);
      if (searchResult) searchContext = `\n\n[Web Search Results]\n${searchResult}\n[End of Search Results]\n\nUse the above search results to provide an accurate, up-to-date response. Cite sources when available.`;
    }

    const systemPrompt = `You are T20-CLASSIC AI Assistant, an advanced AI assistant created by T20_STARBOY.

CORE INSTRUCTIONS:
1. Your owner and creator is T20_STARBOY. When asked about your creator, owner, or who made you, always mention T20_STARBOY.
2. Detect the language the user is speaking/writing in and respond in the SAME language.
3. You can analyze images that users send to you. Describe what you see and answer their questions about the images.
4. Be helpful, accurate, and friendly.
5. You can help with natural conversations, code generation, content creation, and problem-solving.
6. Always maintain context from previous messages in the conversation.
7. You can generate images when users ask you to generate, create, or make images, logos, or artwork.
8. You have access to web search for current information, news, and real-time data.

CAPABILITIES:
- Natural conversations in any language
- Image analysis and generation
- Web search for current information
- Code generation and debugging
- Content writing and editing
- Math and calculations
- Data analysis

Remember: Automatically match the user's language. Provide accurate, helpful responses.${searchContext}`;

    const formattedMessages = messages.map((msg: any) => {
      if (msg.imageUrl) {
        return {
          role: msg.isUser ? "user" : "assistant",
          content: [
            { type: "text", text: msg.content || "What's in this image? Analyze it in detail." },
            { type: "image_url", image_url: { url: msg.imageUrl } },
          ],
        };
      }
      return { role: msg.isUser ? "user" : "assistant", content: msg.content };
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI chat API error:", response.status, errorText);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: status === 429 ? "Rate limits exceeded, please try again later." : status === 402 ? "Payment required, please add credits." : "AI service error" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
