import { Sparkles, Rocket, Shield, Zap, Globe, ImageIcon, Code, Bug, FileCode, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
}

const models = [
  { id: "t20-pro", name: "Pro", desc: "Most capable", icon: Rocket },
  { id: "t20-standard", name: "Standard", desc: "Balanced", icon: Shield },
  { id: "t20-turbo", name: "Turbo", desc: "Fastest", icon: Zap },
];

const capabilities = [
  { label: "Multilingual", icon: Globe },
  { label: "Image Gen", icon: ImageIcon },
  { label: "Code Writing", icon: Code },
  { label: "Debugging", icon: Bug },
  { label: "Architecture", icon: FileCode },
  { label: "Reasoning", icon: Brain },
];

export const ChatSidebar = ({ selectedModel, onModelSelect }: ChatSidebarProps) => {
  return (
    <div className="w-64 h-full bg-sidebar-bg border-r border-border/40 flex flex-col overflow-hidden">
      {/* Brand header */}
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-md glow-sm">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-sidebar-bg animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold gradient-text leading-none">T20-CLASSIC</h1>
            <p className="text-[9px] text-muted-foreground mt-1 tracking-[0.22em] uppercase font-semibold">
              AI · Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-6">
        {/* Models */}
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground/80 mb-2 uppercase tracking-[0.2em] px-1">
            Model
          </h3>
          <div className="space-y-1">
            {models.map((model) => {
              const Icon = model.icon;
              const active = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => onModelSelect(model.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 text-left group",
                    active
                      ? "bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/30"
                      : "hover:bg-secondary/60 border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                      active ? "gradient-brand shadow-sm glow-sm" : "bg-secondary group-hover:bg-secondary/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        active ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                      )}
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-[13px] font-semibold leading-tight transition-colors",
                        active ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                      )}
                    >
                      {model.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">{model.desc}</div>
                  </div>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground/80 mb-2 uppercase tracking-[0.2em] px-1">
            Capabilities
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.label}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary/40 border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <Icon className="w-3 h-3 text-accent flex-shrink-0" strokeWidth={2.2} />
                  <span className="text-[10px] text-foreground/70 font-medium truncate">{cap.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sponsored */}
        <a
          href="https://omg10.com/4/9599187"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl gradient-brand-soft border border-primary/20 p-3 text-center hover:border-primary/40 transition-all group"
        >
          <span className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] block mb-1 font-bold">
            Sponsored
          </span>
          <span className="text-xs font-semibold text-foreground/90 group-hover:text-foreground transition-colors">
            🔥 Check this out
          </span>
        </a>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30 text-center">
        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-[0.3em] font-bold">
          by T20 STARBOY
        </p>
      </div>
    </div>
  );
};
