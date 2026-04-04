import { Bot, User, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isError?: boolean;
  images?: string[];
  onDownloadAd?: () => void;
}

const handleDownload = async (url: string, index: number) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `t20-classic-image-${Date.now()}-${index}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

export const ChatMessage = ({
  content, isUser, isError = false, images, onDownloadAd
}: ChatMessageProps) => {
  return (
    <div className={cn("max-w-[80%] animate-fade-in group", isUser ? "self-end" : "self-start")}>
      <div className="flex items-start gap-3">
        {!isUser && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary/15">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-5 py-4 shadow-sm transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-primary to-[hsl(190,90%,35%)] text-primary-foreground rounded-br-md glow-sm"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
              : "glass-effect rounded-bl-md"
          )}
        >
          {!isUser && !isError && (
            <span className="text-[9px] font-bold text-primary/80 uppercase tracking-[0.2em] mb-1.5 block">
              T20-CLASSIC AI
            </span>
          )}
          {isUser && (
            <span className="text-[9px] font-bold text-primary-foreground/60 uppercase tracking-[0.2em] mb-1.5 block">
              You
            </span>
          )}

          {images && images.length > 0 && (
            <div className="mb-3 space-y-2">
              {images.map((src, i) => (
                <div key={i} className="relative group/img overflow-hidden rounded-xl">
                  <img src={src} alt="AI generated image" className="rounded-xl max-w-full w-full shadow-lg border border-border/10" loading="lazy" />
                  <button
                    onClick={() => { onDownloadAd?.(); handleDownload(src, i); }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-background/70 backdrop-blur-sm border border-border/30 opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary/50"
                    aria-label="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {content && (
            <div className={cn("text-sm leading-relaxed prose prose-sm max-w-none", isUser ? "prose-invert" : "prose-invert")}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center flex-shrink-0 mt-1 border border-border/30">
            <User className="w-4 h-4 text-foreground/70" />
          </div>
        )}
      </div>
    </div>
  );
};