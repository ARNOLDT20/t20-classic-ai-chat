import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MobileSidebar from "@/components/chat/MobileSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import StatusBar from "@/components/chat/StatusBar";
import WelcomeMessage from "@/components/chat/WelcomeMessage";
import { streamChat } from "@/lib/chatApi";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";

export type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string;
};

export type AIModel = "pro" | "standard" | "turbo";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    conversations,
    loading: convsLoading,
    createConversation,
    deleteConversation,
    deleteAllConversations,
    updateConversationTitle,
  } = useConversations(user?.id);

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { messages, loading: msgsLoading, saveMessage, setMessages } = useMessages(
    currentConversationId,
    user?.id
  );
  const [isTyping, setIsTyping] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only run once when conversations are loaded
    if (user && !convsLoading && !initializedRef.current) {
      initializedRef.current = true;
      if (conversations.length === 0) {
        handleNewChat();
      } else if (!currentConversationId) {
        setCurrentConversationId(conversations[0].id);
      }
    }
  }, [user, conversations, convsLoading]);

  const handleNewChat = async () => {
    const newConv = await createConversation();
    if (newConv) {
      setCurrentConversationId(newConv.id);
      setMessages([]);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (id === currentConversationId) {
      const remaining = conversations.filter((c) => c.id !== id);
      setCurrentConversationId(remaining[0]?.id || null);
      if (remaining.length === 0) {
        handleNewChat();
      }
    }
  };

  const handleClearAll = async () => {
    await deleteAllConversations();
    setCurrentConversationId(null);
    initializedRef.current = false;
    handleNewChat();
  };

  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!currentConversationId || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
      imageUrl,
    };

    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);
    setIsTyping(true);

    let assistantContent = "";
    const tempId = (Date.now() + 1).toString();

    try {
      await streamChat({
        messages: [...messages, userMessage],
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && !lastMsg.isUser && lastMsg.id === tempId) {
              return prev.map((m) =>
                m.id === tempId ? { ...m, content: assistantContent } : m
              );
            }
            return [
              ...prev,
              {
                id: tempId,
                content: assistantContent,
                isUser: false,
                timestamp: new Date(),
              },
            ];
          });
        },
        onDone: () => {
          setIsTyping(false);
          
          // Update conversation title from bot's first response
          if (isFirstMessage && assistantContent.trim()) {
            // Extract a summary: first sentence or first 50 chars
            let title = assistantContent.replace(/!\[.*?\]\(.*?\)/g, "").trim(); // Remove image markdown
            const firstSentence = title.match(/^[^.!?]+[.!?]?/)?.[0] || title;
            title = firstSentence.slice(0, 50) + (firstSentence.length > 50 ? "..." : "");
            updateConversationTitle(currentConversationId, title);
          }
          
          saveMessage({
            content: assistantContent,
            isUser: false,
          });
        },
        onError: (error) => {
          setIsTyping(false);
          toast.error(error);
        },
      });
    } catch (error) {
      setIsTyping(false);
      toast.error("Failed to send message");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse gradient-text" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const showWelcome = messages.length === 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <MobileSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAll}
        onSignOut={signOut}
      />

      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onClearAll={handleClearAll}
        onSignOut={signOut}
      />

      <div className="flex flex-1 flex-col">
        <ChatHeader />
        {showWelcome ? (
          <WelcomeMessage />
        ) : (
          <ChatMessages messages={messages} isTyping={isTyping} />
        )}
        <StatusBar modelName="T20-CLASSIC Pro" status="Ready" />
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default Index;
