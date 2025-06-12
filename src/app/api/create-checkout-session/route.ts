import { NextResponse } from "next/server";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const { amount, applicationId, postId, senderId } = await req.json();

    if (!amount || !applicationId || !postId || !senderId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Care Service Payment",
              description: "Payment for care service application",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&application_id=${applicationId}&post_id=${postId}&sender_id=${senderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile`,
      metadata: {
        applicationId,
        postId,
        senderId,
      },
    });

    if (!session || !session.id) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
} 