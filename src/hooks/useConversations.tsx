import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Only load once on mount
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadConversations();
    }

    // Subscribe to realtime changes for new/deleted conversations only
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setConversations((prev) => [payload.new as Conversation, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === payload.new.id ? (payload.new as Conversation) : c))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadConversations]);

  const createConversation = async () => {
    if (!userId) return null;

    try {
      // Don't create if we already have an empty "New Chat"
      const existingEmpty = conversations.find(
        (c) => c.title === "New Chat" || c.title === null
      );
      if (existingEmpty) {
        return existingEmpty;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: null })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast.error("Failed to create conversation");
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
      toast.success("Chat deleted");
    } catch (error: any) {
      toast.error("Failed to delete chat");
    }
  };

  const deleteAllConversations = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
      setConversations([]);
      toast.success("All chats cleared");
    } catch (error: any) {
      toast.error("Failed to clear chats");
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title: title.slice(0, 50) })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to update conversation title:", error);
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    deleteConversation,
    deleteAllConversations,
    updateConversationTitle,
  };
};
