import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  FaPaperPlane,
  FaTrash,
  FaUser,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaCheckDouble,
} from "react-icons/fa";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  is_read?: boolean;
}

interface ChatWindowProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  onClose: () => void;
}

export default function ChatWindow({
  receiverId,
  receiverName,
  receiverAvatar,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey(
              full_name,
              avatar_url
            ),
            receiver:profiles!messages_receiver_id_fkey(
              full_name,
              avatar_url
            )
          `
          )
          .or(
            `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
          )
          .order("created_at", { ascending: true });

        if (error) throw error;

        const transformedMessages =
          data?.map((msg) => ({
            ...msg,
            sender_name: msg.sender?.full_name,
            sender_avatar: msg.sender?.avatar_url,
          })) || [];

        setMessages(transformedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id}))`,
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender_name: senderData?.full_name,
            sender_avatar: senderData?.avatar_url,
          };

          setMessages((current) => [...current, newMessage as Message]);

          // Play notification sound for new messages
          if (payload.new.sender_id !== user.id) {
            const audio = new Audio("/assets/Audio/notification.mp3");
            audio
              .play()
              .catch((err) =>
                console.error("Error playing notification sound:", err)
              );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, receiverId]);

  // Add event listener for opening chat from notification
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { receiverId: newReceiverId } = event.detail;
      if (newReceiverId === receiverId) {
        // If it's the same chat, just ensure it's not minimized
        setIsMinimized(false);
        // Scroll to bottom to show new messages
        scrollToBottom();
      }
    };

    window.addEventListener("openChat", handleOpenChat as EventListener);
    return () => {
      window.removeEventListener("openChat", handleOpenChat as EventListener);
    };
  }, [receiverId]);

  // Handle window focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.hasFocus()) {
        setIsMinimized(false);
        scrollToBottom();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    setIsSending(true);

    try {
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: receiverId,
        content: messageContent,
        created_at: new Date().toISOString(),
        sender_name: user.email || "You",
        is_read: false,
      };
      setMessages((current) => [...current, optimisticMessage]);

      // Send message and create notification in parallel
      const [messageResult, notificationResult] = await Promise.all([
        supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: messageContent,
        }),
        supabase
          .from("notifications")
          .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            type: "chat_message",
            message: `${user.email || "Someone"} sent you a message`,
            metadata: {
              chat_id: receiverId,
              sender_name: user.email,
              message_content: messageContent,
            },
            is_read: false,
          })
          .select(),
      ]);

      if (messageResult.error) throw messageResult.error;
      if (notificationResult.error) throw notificationResult.error;

      // Update the optimistic message with the real one
      const newMessageData = messageResult.data?.[0] as
        | { id: string; created_at: string }
        | undefined;
      if (newMessageData) {
        setMessages((current) =>
          current.map((msg) =>
            msg.id === optimisticMessage.id
              ? {
                  ...msg,
                  id: newMessageData.id,
                  created_at: newMessageData.created_at,
                }
              : msg
          )
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove the optimistic message on error
      setMessages((current) =>
        current.filter((msg) => msg.id !== `temp-${Date.now()}`)
      );
      // Restore the message in the input
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      setMessages((current) => current.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    const messageSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id}))`,
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender_name: senderData?.full_name,
            sender_avatar: senderData?.avatar_url,
          };

          setMessages((current) => [...current, newMessage as Message]);

          // Play notification sound for new messages
          if (payload.new.sender_id !== user.id) {
            const audio = new Audio("/assets/Audio/notification.mp3");
            audio
              .play()
              .catch((err) =>
                console.error("Error playing notification sound:", err)
              );

            // Mark notification as read
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("receiver_id", user.id)
              .eq("sender_id", payload.new.sender_id)
              .eq("type", "chat_message");
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user, receiverId]);

  if (isLoading) {
    return (
      <div className="fixed right-4 bottom-4 w-96 h-[50vh] bg-white rounded-lg shadow-xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed right-4 bottom-4 w-[calc(100%-2rem)] sm:w-96 bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-300 ${
        isMinimized ? "h-16" : "h-[80vh] sm:h-[50vh]"
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-white ring-2 ring-white">
            {receiverAvatar ? (
              <Image
                src={receiverAvatar}
                alt={receiverName}
                fill
                className="object-cover"
              />
            ) : (
              <FaUser className="w-full h-full p-1.5 sm:p-2 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm sm:text-base truncate max-w-[150px] sm:max-w-[200px]">
              {receiverName}
            </h3>
            <p className="text-xs text-blue-100">
              {isTyping ? "Typing..." : "Online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:text-blue-100 p-1.5 sm:p-2 hover:bg-blue-600 rounded-full transition-colors"
          >
            {isMinimized ? (
              <FaChevronUp size={14} />
            ) : (
              <FaChevronDown size={14} />
            )}
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 p-1.5 sm:p-2 hover:bg-blue-600 rounded-full transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <AnimatePresence>
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.sender_id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="flex items-end gap-1.5 sm:gap-2 max-w-[85%] sm:max-w-[80%]">
                    {message.sender_id !== user?.id && (
                      <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-white">
                        {message.sender_avatar ? (
                          <Image
                            src={message.sender_avatar}
                            alt={message.sender_name || "User"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <FaUser className="w-full h-full p-1 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-2.5 sm:p-3 shadow-sm ${
                        message.sender_id === user?.id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="break-words text-sm sm:text-base">
                          {message.content}
                        </p>
                        {message.sender_id === user?.id && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-white hover:text-red-200 flex-shrink-0 transition-colors"
                          >
                            <FaTrash size={10} className="sm:w-3 sm:h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5 sm:mt-1">
                        <span className="text-[10px] sm:text-xs opacity-75">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.sender_id === user?.id && (
                          <span className="text-[10px] sm:text-xs">
                            {message.is_read ? (
                              <FaCheckDouble className="text-blue-300" />
                            ) : (
                              <FaCheck className="text-blue-300" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t bg-white rounded-b-xl"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <FaPaperPlane size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
