import { Brain, Plus, Trash2, LogOut, Image, Globe, Code, MessageSquare, Sparkles, Wand2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onSignOut: () => void;
}

const ChatSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClearAll,
  onSignOut,
}: ChatSidebarProps) => {

  return (
    <aside className="hidden md:flex w-64 bg-sidebar-bg border-r border-sidebar-border p-4 flex-col gap-4">
      <div className="text-center pb-4 border-b border-sidebar-border">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg" style={{ boxShadow: "var(--glow-primary)" }}>
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold gradient-text mb-1">T20-CLASSIC</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">AI ASSISTANT</p>
      </div>

      {/* Model & Capabilities Section */}
      <div className="glass-effect rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Gemini 2.5 Flash</p>
            <p className="text-[10px] text-muted-foreground">Multimodal AI Model</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">Chat</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default">
            <Image className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs">Vision</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default">
            <Search className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs">Web Search</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default">
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs">Code</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-default">
            <Globe className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs">Multilingual</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 cursor-default">
            <Wand2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs">Image Gen</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-br from-primary to-accent hover:shadow-lg transition-all"
          style={{ boxShadow: "var(--glow-primary)" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        {conversations.length > 0 && (
          <Button
            onClick={onClearAll}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Chat History</p>
      
      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div key={conv.id} className="group relative">
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-all text-sm",
                  currentConversationId === conv.id
                    ? "bg-primary/20 border-l-2 border-primary"
                    : "hover:bg-secondary/50"
                )}
              >
                <p className="truncate">{conv.title || "New Chat"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="pt-4 border-t border-sidebar-border">
        <Button
          onClick={onSignOut}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
