import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Plus } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { AdInterstitial } from "@/components/AdInterstitial";
import { BrainLogo } from "@/components/BrainLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { streamChat, type ChatMsg } from "@/lib/streamChat";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  images?: string[];
}

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_HEADER = { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
const IMAGE_GEN_URL = `${BASE_URL}/functions/v1/generate-image`;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const WELCOME: Message = {
  id: "welcome",
  content:
    "Hello 👋 I'm **T20-CLASSIC AI**. Ask me anything — I can chat in any language, generate images, write & debug code, and architect entire projects. What are we building today? 🚀",
  isUser: false,
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingFirstToken, setWaitingFirstToken] = useState(false);
  const [selectedModel, setSelectedModel] = useState("t20-pro");
  const [modelName, setModelName] = useState("T20-CLASSIC Pro");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [adMessage, setAdMessage] = useState("");
  const adCallbackRef = useRef<(() => void) | null>(null);
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const showAd = useCallback((message: string, callback?: () => void) => {
    setAdMessage(message);
    adCallbackRef.current = callback || null;
    setAdOpen(true);
  }, []);

  const handleAdClose = useCallback(() => {
    setAdOpen(false);
    adCallbackRef.current?.();
    adCallbackRef.current = null;
  }, []);

  // Auto-scroll only when near bottom
  useEffect(() => {
    const c = scrollContainerRef.current;
    if (!c) return;
    const nearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 200;
    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    const modelNames: Record<string, string> = {
      "t20-pro": "T20-CLASSIC Pro",
      "t20-standard": "T20-CLASSIC Standard",
      "t20-turbo": "T20-CLASSIC Turbo",
    };
    const name = modelNames[model];
    setModelName(name);
    showAd(`Switching to ${name}...`, () => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), content: `Switched to **${name}** ⚡`, isUser: false },
      ]);
    });
    if (isMobile) setSidebarOpen(false);
  };

  const chatHistoryRef = useRef<ChatMsg[]>([]);

  const generateImage = async (prompt: string): Promise<{ text: string; images: string[] }> => {
    const resp = await fetch(IMAGE_GEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...AUTH_HEADER },
      body: JSON.stringify({ prompt }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || "Image generation failed");
    }
    const data = await resp.json();
    const imageUrls = (data.images || []).map((img: any) => img.image_url?.url || img).filter(Boolean);
    return { text: data.text || "", images: imageUrls };
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { id: Date.now().toString(), content, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setWaitingFirstToken(true);

    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content }];
    const assistantId = (Date.now() + 1).toString();
    let assistantContent = "";
    let started = false;

    await streamChat({
      messages: chatHistoryRef.current,
      onFirstToken: () => {
        // Re-enable input as soon as the first token lands — feels instantaneous
        setWaitingFirstToken(false);
      },
      onDelta: (chunk) => {
        assistantContent += chunk;
        if (!started) {
          started = true;
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantId, content: assistantContent, isUser: false, isStreaming: true },
          ]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
          );
        }
      },
      onDone: async () => {
        if (assistantContent.trim().startsWith("[IMAGE_REQUEST]")) {
          const imagePrompt = assistantContent.replace("[IMAGE_REQUEST]", "").trim();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "🎨 Generating image…", isStreaming: false } : m
            )
          );
          setIsTyping(true);
          setWaitingFirstToken(true);
          try {
            const result = await generateImage(imagePrompt);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: result.text || "Here's your generated image:", images: result.images, isStreaming: false }
                  : m
              )
            );
            chatHistoryRef.current = [
              ...chatHistoryRef.current,
              { role: "assistant", content: `[Generated image: ${imagePrompt}]` },
            ];
          } catch (err: any) {
            toast.error(err.message || "Image generation failed");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: "Sorry, image generation failed.", isError: true, isStreaming: false }
                  : m
              )
            );
          }
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
          );
          chatHistoryRef.current = [
            ...chatHistoryRef.current,
            { role: "assistant", content: assistantContent },
          ];
        }
        setIsTyping(false);
        setWaitingFirstToken(false);
      },
      onError: (err) => {
        toast.error(err);
        setIsTyping(false);
        setWaitingFirstToken(false);
      },
    });
  };

  const handleNewChat = () => {
    showAd("Starting fresh conversation…", () => {
      chatHistoryRef.current = [];
      setMessages([{ ...WELCOME, id: Date.now().toString() }]);
    });
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          isMobile ? "fixed inset-y-0 left-0 z-40" : "relative",
          "transition-all duration-200 ease-out overflow-hidden flex-shrink-0",
          sidebarOpen
            ? isMobile ? "translate-x-0 w-64" : "w-64"
            : isMobile ? "-translate-x-full w-64" : "w-0"
        )}
      >
        <div className="w-64 h-full">
          <ChatSidebar selectedModel={selectedModel} onModelSelect={handleModelSelect} />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 glass-strong border-b border-border/40 flex items-center py-2.5 px-4 gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary/70 transition-all text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2.5">
            <BrainLogo size={30} />
            <div className="text-center">
              <h1 className="text-sm font-extrabold gradient-text leading-none">T20-CLASSIC AI</h1>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-semibold">
                  {isTyping ? "Thinking" : waitingFirstToken ? "Streaming" : "Ready"} · {modelName}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg hover:bg-secondary/70 transition-all text-muted-foreground hover:text-foreground"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto chat-scroll relative z-10"
        >
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                isError={message.isError}
                isStreaming={message.isStreaming}
                images={message.images}
                onDownloadAd={() => showAd("Downloading…")}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10">
          <ChatInput onSend={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
      <AdInterstitial open={adOpen} onClose={handleAdClose} message={adMessage} />
    </div>
  );
};

export default Index;
