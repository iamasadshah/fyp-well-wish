"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiUser, FiMail, FiLock, FiPhone } from "react-icons/fi";
import Toast from "../ui/Toast";

interface ToastState {
  message: string;
  type: "success" | "error";
}

// SignupForm component provides a user registration form with authentication and feedback
export default function SignupForm() {
  // State for email, password, full name, loading, and toast messages
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { signUp } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  // Add a new state for top-level form error
  const [formError, setFormError] = useState<string | null>(null);

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    let strength = "";
    if (pwd.length < 8) strength = "Too short";
    else if (!/[A-Z]/.test(pwd)) strength = "Add uppercase letter";
    else if (!/[a-z]/.test(pwd)) strength = "Add lowercase letter";
    else if (!/[0-9]/.test(pwd)) strength = "Add a number";
    else if (!/[^A-Za-z0-9]/.test(pwd)) strength = "Add a special character";
    else strength = "Strong";
    setPasswordStrength(strength);
    return strength === "Strong";
  };

  const validate = () => {
    const newErrors: { fullName?: string; email?: string; password?: string } =
      {};
    if (!fullName.trim()) newErrors.fullName = "Please enter your full name.";
    if (!email.trim()) newErrors.email = "Please enter your Gmail address.";
    else if (!/^[^@\s]+@gmail\.com$/.test(email.trim()))
      newErrors.email =
        "Please provide a valid Gmail address (ending with @gmail.com).";
    if (!password) newErrors.password = "Please enter a password.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handles form submission and registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setIsLoading(true);
    if (!checkPasswordStrength(password)) {
      setFormError(
        "Your password is not strong enough. Please follow the password requirements."
      );
      setIsLoading(false);
      return;
    }
    try {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        phone,
      });
      if (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Signup failed. Please check your details and try again.";
        setFormError(errorMessage);
        setIsLoading(false);
        return;
      }
      router.push("/profile");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Signup form with full name, email, and password fields */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 font-semibold text-center shadow-sm">
            {formError}
          </div>
        )}
        <div>
          {errors.fullName && (
            <div className="mb-2 text-sm text-red-600 font-medium">
              {errors.fullName}
            </div>
          )}
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          {errors.email && (
            <div className="mb-2 text-sm text-red-600 font-medium">
              {errors.email}
            </div>
          )}
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone (optional)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiPhone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. +1234567890"
            />
          </div>
        </div>

        <div>
          {errors.email && (
            <div className="mb-2 text-sm text-red-600 font-medium">
              {errors.email}
            </div>
          )}
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Gmail Address
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="yourname@gmail.com"
            />
          </div>
        </div>

        <div>
          {errors.password && (
            <div className="mb-2 text-sm text-red-600 font-medium">
              {errors.password}
            </div>
          )}
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkPasswordStrength(e.target.value);
              }}
              className={`block w-full pl-10 pr-3 py-2 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="••••••••"
            />
          </div>
          {password && (
            <p
              className={`mt-1 text-xs ${
                passwordStrength === "Strong"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              Password strength: {passwordStrength}
            </p>
          )}
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
        </div>
      </form>

      {/* Toast notification for feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
