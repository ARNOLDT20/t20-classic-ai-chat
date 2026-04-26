export type ChatMsg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  onFirstToken,
  signal,
}: {
  messages: ChatMsg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
  onFirstToken?: () => void;
  signal?: AbortSignal;
}) {
  let firstTokenFired = false;
  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    onError(e?.message || "Network error");
    return;
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Flush deltas on microtask for the lowest-latency feel
  let pending = "";
  let scheduled = false;
  const flush = () => {
    if (pending) {
      onDelta(pending);
      pending = "";
    }
    scheduled = false;
  };
  const schedule = (chunk: string) => {
    if (!firstTokenFired) {
      firstTokenFired = true;
      onFirstToken?.();
    }
    pending += chunk;
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flush);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          flush();
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) schedule(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    onError(e?.message || "Stream error");
    return;
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const content = JSON.parse(json).choices?.[0]?.delta?.content;
        if (content) schedule(content);
      } catch {
        /* ignore */
      }
    }
  }

  flush();
  onDone();
}
