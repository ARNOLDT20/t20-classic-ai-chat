import { useEffect, useRef, useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { Message } from "@/pages/Index";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

const ChatMessages = ({ messages, isTyping }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleCopyCode = async (code: string, index: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeIndex(index);
      toast.success("Code copied!");
      setTimeout(() => setCopiedCodeIndex(null), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted">
      {messages.map((message, msgIndex) => (
        <div
          key={message.id}
          className={cn(
            "max-w-[80%] animate-fade-in group",
            message.isUser ? "ml-auto" : "mr-auto"
          )}
        >
          <div
            className={cn(
              "rounded-2xl px-5 py-3 shadow-lg relative",
              message.isUser
                ? "bg-chat-user text-chat-user-foreground rounded-br-sm"
                : "glass-effect rounded-bl-sm"
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2 text-xs opacity-80">
              <div className="flex items-center gap-2">
                {message.isUser ? (
                  <User className="w-3 h-3" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                <span>{message.isUser ? "You" : "T20-CLASSIC AI"}</span>
              </div>
              <button
                onClick={() => handleCopy(message.content, message.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary/50 rounded"
                title="Copy to clipboard"
              >
                {copiedId === message.id ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            {message.imageUrl && (
              <img 
                src={message.imageUrl} 
                alt="Uploaded" 
                className="max-w-full max-h-64 rounded-lg mb-2" 
              />
            )}
            <div className="leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-pre:p-0 prose-pre:bg-transparent">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match && !String(children).includes("\n");
                    const codeContent = String(children).replace(/\n$/, "");
                    const codeId = `${message.id}-${msgIndex}-${Math.random()}`;
                    
                    if (isInline) {
                      return (
                        <code className="bg-secondary/80 px-1.5 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <div className="relative group/code my-3">
                        <div className="flex items-center justify-between bg-secondary/90 px-4 py-2 rounded-t-lg border-b border-border">
                          <span className="text-xs text-muted-foreground font-mono">
                            {match ? match[1] : "code"}
                          </span>
                          <button
                            onClick={() => handleCopyCode(codeContent, codeId)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedCodeIndex === codeId ? (
                              <>
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="bg-secondary/50 p-4 rounded-b-lg overflow-x-auto">
                          <code className={cn("text-sm", className)} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  img({ src, alt }) {
                    return (
                      <div className="my-3">
                        <img 
                          src={src} 
                          alt={alt || "Generated image"} 
                          className="max-w-full rounded-lg shadow-lg"
                        />
                      </div>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="max-w-[80%] mr-auto animate-fade-in">
          <div className="glass-effect rounded-2xl rounded-bl-sm px-5 py-3 inline-flex items-center gap-2">
            <Bot className="w-3 h-3" />
            <span className="text-xs opacity-80 mr-2">T20-CLASSIC AI</span>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce-dot" />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-2 h-2 bg-primary rounded-full animate-bounce-dot"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
