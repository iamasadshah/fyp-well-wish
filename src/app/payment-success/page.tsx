"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        const sessionId = searchParams.get("session_id");
        const applicationId = searchParams.get("application_id");
        const postId = searchParams.get("post_id");
        const senderId = searchParams.get("sender_id");

        if (!sessionId || !applicationId || !postId || !senderId || !user) {
          throw new Error("Missing required parameters");
        }

        // Create success notification for the sender
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            sender_id: user.id,
            receiver_id: senderId,
            type: "application_accepted",
            message:
              "Your application has been accepted and payment has been made. Please complete the task to receive payment.",
            metadata: {
              post_id: postId,
              session_id: sessionId,
            },
          });

        if (notificationError) throw notificationError;

        // Delete the original application notification
        const { error: deleteError } = await supabase
          .from("notifications")
          .delete()
          .eq("id", applicationId);

        if (deleteError) throw deleteError;

        toast.success("Payment successful! The applicant has been notified.");
        router.push("/profile");
      } catch (err) {
        console.error("Error handling payment success:", err);
        toast.error("Error processing payment success");
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [router, searchParams, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return null;
}
