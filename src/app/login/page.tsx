"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import Toast from "@/components/ui/Toast";
import LoginForm from "@/components/auth/LoginForm";

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to sign in with Google";
        setToast({
          message: errorMessage,
          type: "error",
        });
        return;
      }
      router.push("/profile");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setToast({
        message: errorMessage,
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
