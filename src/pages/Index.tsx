import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Plus } from "lucide-react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { AdInterstitial } from "@/components/AdInterstitial";
import { useIsMobile } from "@/hooks/use-mobile";
import { streamChat, type ChatMsg } from "@/lib/streamChat";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  isError?: boolean;
  images?: string[];
  audioUrl?: string;
}

const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
const MUSIC_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`;

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your **T20-CLASSIC AI** assistant. I can chat in any language, generate images, and create music. How can I help you today? 🚀",
      isUser: false,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("t20-pro");
  const [modelName, setModelName] = useState("T20-CLASSIC Pro");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [adMessage, setAdMessage] = useState("");
  const adCallbackRef = useRef<(() => void) | null>(null);
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        { id: Date.now().toString(), content: `Model switched to **${name}**`, isUser: false },
      ]);
    });
    if (isMobile) setSidebarOpen(false);
  };

  const chatHistoryRef = useRef<ChatMsg[]>([]);

  const generateImage = async (prompt: string): Promise<{ text: string; images: string[] }> => {
    const resp = await fetch(IMAGE_GEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
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

  const generateMusic = async (prompt: string): Promise<string> => {
    const resp = await fetch(MUSIC_GEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt, duration: 30 }),
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || "Music generation failed");
    }
    const data = await resp.json();
    return `data:audio/mpeg;base64,${data.audio}`;
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { id: Date.now().toString(), content, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content }];
    const assistantId = (Date.now() + 1).toString();
    let assistantContent = "";

    await streamChat({
      messages: chatHistoryRef.current,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && !last.isUser && last.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { id: assistantId, content: assistantContent, isUser: false }];
        });
        setIsTyping(false);
      },
      onDone: async () => {
        // Check for image generation
        if (assistantContent.trim().startsWith("[IMAGE_REQUEST]")) {
          const imagePrompt = assistantContent.replace("[IMAGE_REQUEST]", "").trim();
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: "🎨 Generating image..." } : m)
          );
          setIsTyping(true);
          try {
            const result = await generateImage(imagePrompt);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: result.text || "Here's your generated image:", images: result.images }
                  : m
              )
            );
            chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: `[Generated image: ${imagePrompt}]` }];
          } catch (err: any) {
            toast.error(err.message || "Image generation failed");
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: "Sorry, image generation failed. Please try again.", isError: true } : m)
            );
          }
        }
        // Check for music generation
        else if (assistantContent.trim().startsWith("[MUSIC_REQUEST]")) {
          const musicPrompt = assistantContent.replace("[MUSIC_REQUEST]", "").trim();
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: "🎵 Generating music... This may take a moment." } : m)
          );
          setIsTyping(true);
          try {
            const audioUrl = await generateMusic(musicPrompt);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: "Here's your generated music! 🎶", audioUrl }
                  : m
              )
            );
            chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: `[Generated music: ${musicPrompt}]` }];
          } catch (err: any) {
            toast.error(err.message || "Music generation failed");
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: "Sorry, music generation failed. Please try again.", isError: true } : m)
            );
          }
        } else {
          chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: assistantContent }];
        }
        setIsTyping(false);
      },
      onError: (err) => {
        toast.error(err);
        setIsTyping(false);
      },
    });
  };

  const handleNewChat = () => {
    showAd("Starting fresh conversation...", () => {
      chatHistoryRef.current = [];
      setMessages([
        { id: Date.now().toString(), content: "New conversation started. How can I help you? 🚀", isUser: false },
      ]);
    });
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
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

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="glass-effect border-b border-border/20 flex items-center py-3 px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-extrabold gradient-text">T20-CLASSIC AI</h1>
            <p className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-medium">
              Multilingual • Image • Music • Code
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl hover:bg-secondary/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scroll p-5 flex flex-col gap-5">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              isUser={message.isUser}
              isError={message.isError}
              images={message.images}
              audioUrl={message.audioUrl}
              onDownloadAd={() => showAd("Downloading...")}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Status bar */}
        <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm px-4 py-1.5 flex justify-between text-[9px] text-muted-foreground/70">
          <span>
            Model: <span className="text-primary font-medium">{modelName}</span>
          </span>
          <span>
            Status: <span className={isTyping ? "text-accent font-medium" : "text-primary/80 font-medium"}>{isTyping ? "Thinking..." : "Ready"}</span>
          </span>
        </div>

        <ChatInput onSend={handleSendMessage} disabled={isTyping} />
      </div>
      <AdInterstitial open={adOpen} onClose={handleAdClose} message={adMessage} />
    </div>
  );
};

export default Index;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
