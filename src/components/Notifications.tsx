"use client";

import { useState, useEffect, useCallback } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  sender_id: string;
  receiver_id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  booking_id?: string;
  metadata?: {
    chat_id?: string;
    sender_name?: string;
    message_content?: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as Notification;
          setNotifications((current) => [notification, ...current]);
          setUnreadCount((count) => count + 1);

          // Play notification sound
          const audio = new Audio("/assets/Audio/notification.mp3");
          audio
            .play()
            .catch((err) => console.error("Error playing sound:", err));

          // Show browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification("New Notification", {
              body: notification.message,
              icon: "/assets/logo.png",
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id);

        setNotifications((current) =>
          current.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }

    // Handle different notification types
    if (
      notification.type === "chat_message" &&
      notification.metadata?.chat_id
    ) {
      // Close notifications panel
      setIsOpen(false);

      // Navigate to find-caregiver page if not already there
      if (!window.location.pathname.includes("/find-caregiver")) {
        router.push("/find-caregiver");
      }

      // Dispatch custom event to open chat window
      const event = new CustomEvent("openChat", {
        detail: {
          receiverId: notification.sender_id,
          receiverName: notification.metadata.sender_name || "User",
        },
      });
      window.dispatchEvent(event);
    }
  };

  const handleBookingResponse = async (
    notification: Notification,
    accept: boolean
  ) => {
    try {
      if (accept) {
        // Update booking status to accepted
        const { error: bookingError } = await supabase
          .from("bookings")
          .update({ status: "accepted" })
          .eq("id", notification.booking_id);

        if (bookingError) throw bookingError;

        // Create a new notification for payment
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            sender_id: notification.receiver_id,
            receiver_id: notification.sender_id,
            booking_id: notification.booking_id,
            type: "payment_required",
            message:
              "Your booking has been accepted. Please complete the payment.",
          });

        if (notificationError) throw notificationError;

        // Create a success notification for the sender
        const { error: successNotificationError } = await supabase
          .from("notifications")
          .insert({
            sender_id: notification.receiver_id,
            receiver_id: notification.sender_id,
            booking_id: notification.booking_id,
            type: "booking_accepted",
            message:
              "Congratulations! Your booking has been accepted. Please discuss the work with the post owner using the chat button.",
          });

        if (successNotificationError) throw successNotificationError;

        // Close notifications panel
        setIsOpen(false);

        // Redirect to payment page
        const { data: booking } = await supabase
          .from("bookings")
          .select("amount")
          .eq("id", notification.booking_id)
          .single();

        if (booking) {
          router.push(
            `/payment?booking_id=${notification.booking_id}&amount=${booking.amount}`
          );
        }
      } else {
        // Update booking status to rejected
        const { error: bookingError } = await supabase
          .from("bookings")
          .update({ status: "rejected" })
          .eq("id", notification.booking_id);

        if (bookingError) throw bookingError;

        // Create a new notification for rejection
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            sender_id: notification.receiver_id,
            receiver_id: notification.sender_id,
            type: "booking_rejected",
            message: "Your booking request has been rejected.",
          });

        if (notificationError) throw notificationError;
      }

      // Delete the original notification
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notification.id);

      if (deleteError) throw deleteError;

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    } catch (err) {
      console.error("Error handling booking response:", err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      !notification.is_read
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          {notification.message}
                        </p>
                        {notification.type === "chat_message" &&
                          notification.metadata?.message_content && (
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.metadata.message_content}
                            </p>
                          )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>

                        {/* Add Accept/Reject buttons for booking requests */}
                        {notification.type === "booking_request" && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookingResponse(notification, true);
                              }}
                              className="flex-1 bg-green-600 text-white py-1 px-3 rounded-md text-sm hover:bg-green-700 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookingResponse(notification, false);
                              }}
                              className="flex-1 bg-red-600 text-white py-1 px-3 rounded-md text-sm hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
