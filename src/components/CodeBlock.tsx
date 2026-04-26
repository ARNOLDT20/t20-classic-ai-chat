import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language?: string;
  children: string;
}

export const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code rounded-xl overflow-hidden my-3 border border-border/50 bg-[hsl(224,32%,4%)] shadow-elevated">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[hsl(224,28%,7%)] border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[hsl(0_70%_55%)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[hsl(40_85%_55%)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[hsl(140_60%_50%)]" />
          </div>
          <span className="text-[10px] font-mono font-semibold text-muted-foreground/80 uppercase tracking-wider ml-1">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-200",
            copied
              ? "bg-accent/20 text-accent"
              : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto chat-scroll">
        <pre className="p-4 text-[12.5px] leading-[1.7]">
          <code className="font-mono text-foreground/90">{children}</code>
        </pre>
      </div>
    </div>
  );
};
