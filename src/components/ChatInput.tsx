import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-end gap-2 max-w-4xl mx-auto",
          "glass-strong rounded-2xl p-2 transition-all duration-200",
          "focus-within:ring-brand"
        )}
      >
        <Textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message T20-CLASSIC AI…"
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-[180px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 text-[15px] leading-relaxed shadow-none"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150",
            canSend
              ? "gradient-brand text-white shadow-md glow-sm hover:scale-105 active:scale-95"
              : "bg-secondary text-muted-foreground/50 cursor-not-allowed"
          )}
          aria-label="Send"
        >
          {disabled ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </form>
      <p className="text-center text-[10px] text-muted-foreground/50 mt-2 tracking-wide">
        T20-CLASSIC AI can make mistakes. Verify important info.
      </p>
    </div>
  );
};
