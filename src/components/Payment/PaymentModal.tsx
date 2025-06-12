import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import PaymentForm from "./PaymentForm";
import { supabase } from "@/lib/supabase";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingId: string;
  caregiverId: string;
  senderId: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  bookingId,
  caregiverId,
  senderId,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "usd",
          bookingId,
        }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [isOpen, amount, bookingId]);

  const handlePaymentSuccess = async () => {
    try {
      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", bookingId);

      // Send notification to the sender
      await supabase.from("notifications").insert({
        sender_id: caregiverId,
        receiver_id: senderId,
        type: "booking_accepted",
        message:
          "Your booking has been accepted and payment has been completed.",
      });

      onClose();
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Complete Payment
          </Dialog.Title>
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
