"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { stripePromise } from "@/lib/stripe";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

interface Application {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  metadata: {
    post_id: string;
    care_type: string;
    location: string;
    budget: number;
    duration: string;
  };
  sender_profile: {
    full_name: string;
    contact_number: string;
    location: string;
  };
}

export default function ApplicationsManager() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      // First, get all notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .eq("receiver_id", user?.id)
        .eq("type", "application")
        .order("created_at", { ascending: false });

      if (notificationsError) throw notificationsError;

      // Then, get all sender profiles
      const senderIds = notifications?.map((n) => n.sender_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", senderIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const applicationsWithProfiles =
        notifications?.map((notification) => ({
          ...notification,
          sender_profile: profiles?.find(
            (p) => p.id === notification.sender_id
          ) || {
            full_name: "Unknown User",
            contact_number: "Not provided",
            location: "Not provided",
          },
        })) || [];

      setApplications(applicationsWithProfiles);
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (application: Application) => {
    try {
      // Create a Stripe Checkout Session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: application.metadata.budget,
          applicationId: application.id,
          postId: application.metadata.post_id,
          senderId: application.sender_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error("No session ID received");
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const handleReject = async (application: Application) => {
    try {
      // Create rejection notification
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          sender_id: user?.id,
          receiver_id: application.sender_id,
          type: "application_rejected",
          message: `Your application for ${application.metadata.care_type} in ${application.metadata.location} has been rejected.`,
          metadata: {
            post_id: application.metadata.post_id,
          },
        });

      if (notificationError) throw notificationError;

      // Delete the original application notification
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", application.id);

      if (deleteError) throw deleteError;

      // Update local state
      setApplications((prev) =>
        prev.filter((app) => app.id !== application.id)
      );

      toast.success("Application rejected successfully");
    } catch (err) {
      console.error("Error rejecting application:", err);
      toast.error("Failed to reject application");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
      {applications.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No applications yet</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {application.sender_profile.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {application.metadata.care_type} in{" "}
                    {application.metadata.location}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-gray-700">{application.message}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <span className="ml-2 text-gray-900">
                      ${application.metadata.budget}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-gray-900">
                      {application.metadata.duration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => handleAccept(application)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Accept & Pay
                </button>
                <button
                  onClick={() => handleReject(application)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
