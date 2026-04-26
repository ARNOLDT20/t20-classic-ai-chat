import { Sparkles, User, Download, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { useState, memo } from "react";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isError?: boolean;
  isStreaming?: boolean;
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

const ChatMessageComponent = ({
  content,
  isUser,
  isError = false,
  isStreaming = false,
  images,
  onDownloadAd,
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "w-full flex animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex items-start gap-3 max-w-[88%]", isUser && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md",
            isUser
              ? "bg-secondary border border-border/40"
              : "gradient-brand glow-sm"
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-foreground/70" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          )}
        </div>

        {/* Bubble */}
        <div className={cn("flex-1 min-w-0 group/msg", isUser && "flex flex-col items-end")}>
          {/* Label */}
          <div
            className={cn(
              "flex items-center gap-2 mb-1.5 px-1",
              isUser ? "flex-row-reverse" : ""
            )}
          >
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.18em]",
                isUser ? "text-foreground/50" : "gradient-text"
              )}
            >
              {isUser ? "You" : "T20-CLASSIC AI"}
            </span>
            {!isUser && !isError && content && !isStreaming && (
              <button
                onClick={copyMessage}
                className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                aria-label="Copy message"
              >
                {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Content */}
          <div
            className={cn(
              "rounded-2xl px-4 py-3 transition-all overflow-hidden",
              isUser
                ? "gradient-brand text-white rounded-tr-sm shadow-elevated glow-sm"
                : isError
                ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-sm"
                : "glass-effect rounded-tl-sm shadow-elevated"
            )}
          >
            {images && images.length > 0 && (
              <div className="mb-3 space-y-2">
                {images.map((src, i) => (
                  <div key={i} className="relative group/img overflow-hidden rounded-xl border border-border/30">
                    <img
                      src={src}
                      alt="AI generated"
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                    <button
                      onClick={() => {
                        onDownloadAd?.();
                        handleDownload(src, i);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg glass-strong opacity-0 group-hover/img:opacity-100 transition-all hover:gradient-brand hover:text-white"
                      aria-label="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {content && (
              <div
                className={cn(
                  "text-[14px] leading-[1.65] prose prose-sm prose-invert max-w-none",
                  "[&>p]:mb-3 [&>p:last-child]:mb-0",
                  "[&>ul]:mb-3 [&>ol]:mb-3 [&>ul]:space-y-1 [&>ol]:space-y-1 [&>ul]:pl-5 [&>ol]:pl-5",
                  "[&>ul>li]:list-disc [&>ol>li]:list-decimal",
                  "[&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-3 [&>h1]:mt-4",
                  "[&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:mt-4",
                  "[&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-3",
                  "[&>blockquote]:border-l-2 [&>blockquote]:border-primary/50 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-foreground/70 [&>blockquote]:my-3",
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-glow",
                  "[&_strong]:font-semibold",
                  isStreaming && "stream-caret"
                )}
              >
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children).replace(/\n$/, "");
                      if (match || codeString.includes("\n")) {
                        return <CodeBlock language={match?.[1]}>{codeString}</CodeBlock>;
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md bg-secondary/80 text-primary-glow font-mono text-[12.5px] border border-border/30"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatMessage = memo(ChatMessageComponent);
