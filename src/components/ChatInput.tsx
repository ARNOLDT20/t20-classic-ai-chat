import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");

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

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 border-t border-border/20 bg-card/30 backdrop-blur-xl">
      <div className="flex-1 relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… generate images or music 🎵"
          disabled={disabled}
          rows={1}
          className="min-h-[52px] max-h-[140px] resize-none bg-secondary/40 border-border/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/70 px-4 py-3.5 text-sm rounded-xl transition-all duration-200"
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || !input.trim()}
        size="icon"
        className="h-[52px] w-[52px] bg-gradient-to-br from-primary to-accent hover:opacity-90 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/35 hover:scale-[1.03] active:scale-95 disabled:opacity-30 disabled:scale-100 flex-shrink-0"
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
};
