"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    setChecking(true);
    // Poll every 3 seconds to check if email is verified
    const id = setInterval(async () => {
      await user?.reload?.(); // For Firebase, not Supabase, but keep for future
      const { data, error } = await fetch("/api/check-email-verified").then(
        (res) => res.json()
      );
      if (data?.isVerified) {
        clearInterval(id);
        router.push("/profile");
      }
    }, 3000);
    setIntervalId(id);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-4">
          Verify your email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          We have sent a verification link to your email address. Please check
          your inbox and click the link to verify your account.
        </p>
        <p className="text-gray-500 text-center text-sm">
          Once your email is verified, you will be redirected to your profile
          page automatically.
        </p>
        {checking && (
          <p className="text-center text-blue-500 mt-4">
            Waiting for verification...
          </p>
        )}
      </div>
    </div>
  );
}
