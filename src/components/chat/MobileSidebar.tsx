import { Menu, Plus, Trash2, LogOut, Brain, Image, Globe, Code, MessageSquare, Sparkles, Wand2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onSignOut: () => void;
}

const MobileSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClearAll,
  onSignOut,
}: MobileSidebarProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden fixed top-4 left-4 z-50 glass-effect"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar-bg">
        <SheetHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg" style={{ boxShadow: "var(--glow-primary)" }}>
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="gradient-text text-lg">T20-CLASSIC</SheetTitle>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AI ASSISTANT</p>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100%-80px)]">
          {/* Model & Capabilities Section */}
          <div className="p-4 border-b border-sidebar-border">
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
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs">Chat</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <Image className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs">Vision</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <Search className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs">Web Search</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <Code className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs">Code</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <Globe className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs">Multilingual</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20">
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs">Image Gen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="p-4 space-y-2">
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

          {/* Conversations List */}
          <ScrollArea className="flex-1 px-4">
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Chat History</p>
            <div className="space-y-2 pb-4">
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

          {/* Sign Out */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              onClick={onSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
