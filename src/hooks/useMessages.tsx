import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Message } from "@/pages/Index";

export const useMessages = (conversationId: string | null, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedConversationRef = useRef<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        timestamp: new Date(msg.created_at!),
        imageUrl: msg.image_url || undefined,
      }));

      setMessages(formattedMessages);
    } catch (error: any) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !userId) {
      setMessages([]);
      setLoading(false);
      loadedConversationRef.current = null;
      return;
    }

    // Only load messages once per conversation
    if (loadedConversationRef.current !== conversationId) {
      loadedConversationRef.current = conversationId;
      setLoading(true);
      loadMessages();
    }

    // No realtime subscription to prevent continuous reloading
    // Messages are managed locally through setMessages
  }, [conversationId, userId, loadMessages]);

  const saveMessage = async (message: Omit<Message, "id" | "timestamp">) => {
    if (!conversationId || !userId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        content: message.content,
        is_user: message.isUser,
        image_url: message.imageUrl || null,
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error("Failed to save message");
    }
  };

  return { messages, loading, saveMessage, setMessages };
};
