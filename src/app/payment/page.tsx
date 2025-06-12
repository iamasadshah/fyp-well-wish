"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import PaymentForm from "@/components/Payment/PaymentForm";
import { supabase } from "@/lib/supabase";

interface PaymentPageContentProps {
  bookingId: string;
  amount: number;
}

function PaymentPageContent({ bookingId, amount }: PaymentPageContentProps) {
  const handlePaymentSuccess = async () => {
    try {
      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", bookingId);

      // Get booking details to send notification
      const { data: booking } = await supabase
        .from("bookings")
        .select("sender_id, caregiver_id")
        .eq("id", bookingId)
        .single();

      if (booking) {
        // Send notification to the sender
        await supabase.from("notifications").insert({
          sender_id: booking.caregiver_id,
          receiver_id: booking.sender_id,
          type: "booking_paid",
          message: "Your booking has been paid and confirmed.",
        });
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  // We don't need to check for clientSecret here anymore

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Complete Payment
          </h1>
          <p className="text-gray-600 mb-6">Amount to pay: ${amount}</p>
          <PaymentForm onSuccess={handlePaymentSuccess} />
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingId = searchParams.get("booking_id");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!bookingId || !amount) {
      setError("Missing booking information.");
      setLoading(false);
      return;
    }

    // Create payment intent
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        booking_id: bookingId,
        amount: Number(amount),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching payment intent:", error);
        setError("Failed to load payment options.");
        setLoading(false);
      });
  }, [bookingId, amount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  if (!clientSecret || !bookingId || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-500 text-lg">
          Unable to process payment. Please try again.
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentPageContent bookingId={bookingId} amount={Number(amount)} />
    </Elements>
  );
}
