import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.in.projectsegfau.lt",
];

async function fetchWithFallback(path: string): Promise<Response> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const resp = await fetch(`${instance}${path}`);
      if (resp.ok) return resp;
      await resp.text(); // consume body
    } catch {
      // try next instance
    }
  }
  throw new Error("All Piped instances failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, videoId } = await req.json();

    if (action === "search") {
      if (!query) throw new Error("Query is required");

      console.log("Searching songs:", query);
      const resp = await fetchWithFallback(
        `/search?q=${encodeURIComponent(query)}&filter=music_songs`
      );
      const data = await resp.json();

      const results = (data.items || [])
        .filter((item: any) => item.type === "stream")
        .slice(0, 8)
        .map((item: any) => ({
          id: item.url?.replace("/watch?v=", "") || "",
          title: item.title || "Unknown",
          artist: item.uploaderName || "Unknown",
          duration: item.duration || 0,
          thumbnail: item.thumbnail || "",
        }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stream") {
      if (!videoId) throw new Error("videoId is required");

      console.log("Getting stream for:", videoId);
      const resp = await fetchWithFallback(`/streams/${videoId}`);
      const data = await resp.json();

      // Find best audio stream
      const audioStreams = (data.audioStreams || [])
        .filter((s: any) => s.mimeType?.includes("audio"))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      const bestAudio = audioStreams[0];

      if (!bestAudio) {
        throw new Error("No audio stream found");
      }

      return new Response(
        JSON.stringify({
          title: data.title || "Unknown",
          artist: data.uploader || "Unknown",
          thumbnail: data.thumbnailUrl || "",
          audioUrl: bestAudio.url,
          duration: data.duration || 0,
          mimeType: bestAudio.mimeType || "audio/mp4",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action. Use 'search' or 'stream'.");
  } catch (e) {
    console.error("song-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
