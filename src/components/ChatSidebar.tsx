import { Brain, Rocket, Shield, Zap, Sparkles, Globe, ImageIcon, Code, Music, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

const models = [
  { id: "t20-pro", name: "T20-CLASSIC Pro", icon: Rocket, desc: "Most capable" },
  { id: "t20-standard", name: "T20-CLASSIC Standard", icon: Shield, desc: "Balanced" },
  { id: "t20-turbo", name: "T20-CLASSIC Turbo", icon: Zap, desc: "Fastest" },
];

const capabilities = [
  { label: "Multilingual Chat", icon: Globe },
  { label: "Image Generation", icon: ImageIcon },
  { label: "Music Generation", icon: Music },
  { label: "Song Search & Download", icon: Search },
  { label: "Code Generation", icon: Code },
  { label: "Problem Solving", icon: Sparkles },
];

export const ChatSidebar = ({ selectedModel, onModelSelect }: ChatSidebarProps) => {
  return (
    <div className="w-64 bg-sidebar-bg border-r border-border/20 flex flex-col p-5 overflow-y-auto chat-scroll">
      {/* Logo */}
      <div className="text-center mb-8 pb-6 border-b border-border/15">
        <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300">
          <Brain className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-extrabold gradient-text tracking-wide">T20-CLASSIC</h1>
        <p className="text-[9px] text-muted-foreground mt-1 tracking-[0.25em] uppercase font-medium">
          AI Assistant
        </p>
      </div>

      {/* Models */}
      <div className="mb-6">
        <h3 className="text-[9px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.2em] px-1">
          Models
        </h3>
        <div className="space-y-1.5">
          {models.map((model) => {
            const Icon = model.icon;
            const active = selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm group",
                  active
                    ? "bg-primary/10 border border-primary/25 glow-sm"
                    : "hover:bg-secondary/50 border border-transparent hover:border-border/30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  active ? "bg-primary/20" : "bg-secondary/60 group-hover:bg-secondary"
                )}>
                  <Icon className={cn("w-4 h-4 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground/80")} />
                </div>
                <div className="text-left">
                  <span className={cn("text-xs font-semibold block transition-colors", active ? "text-foreground" : "text-foreground/60 group-hover:text-foreground/80")}>{model.name}</span>
                  <span className="text-[10px] text-muted-foreground">{model.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Capabilities */}
      <div className="glass-effect rounded-xl p-4">
        <h3 className="text-[9px] font-bold text-muted-foreground mb-3 uppercase tracking-[0.2em]">
          Capabilities
        </h3>
        <div className="space-y-2.5">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.label} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-accent" />
                </div>
                <span className="text-xs text-foreground/60">{cap.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sponsored Ad */}
      <div className="mt-5">
        <a
          href="https://omg10.com/4/9599187"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-3 text-center hover:from-primary/20 hover:to-accent/20 transition-all duration-300 group"
        >
          <span className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] block mb-1">Sponsored</span>
          <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">🔥 Check This Out</span>
        </a>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-5 text-center">
        <p className="text-[8px] text-muted-foreground/40 uppercase tracking-[0.3em] font-medium">by T20 STARBOY</p>
      </div>
    </div>
  );
};
