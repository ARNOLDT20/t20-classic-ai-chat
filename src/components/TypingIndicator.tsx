import { Sparkles } from "lucide-react";

export const TypingIndicator = () => {
  return (
    <div className="w-full flex justify-start animate-fade-in">
      <div className="flex items-start gap-3 max-w-[88%]">
        <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md glow-sm">
          <Sparkles className="w-4 h-4 text-white animate-pulse-dot" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] gradient-text">
              T20-CLASSIC AI
            </span>
            <span className="text-[10px] shimmer font-medium">thinking…</span>
          </div>
          <div className="glass-effect rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-elevated">
            <div className="flex gap-1.5 items-center h-4">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
