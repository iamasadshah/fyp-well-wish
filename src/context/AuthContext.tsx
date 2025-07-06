"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null; // Current authenticated user, or null if not logged in
  session: Session | null; // Current session object, or null if not logged in
  loading: boolean; // Whether authentication state is being determined
  signIn: (email: string, password: string) => Promise<{ error: unknown }>; // Sign in with email/password
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ error: unknown }>; // Sign up with email/password and optional metadata
  signInWithGoogle: () => Promise<{ error: unknown }>; // Sign in with Google OAuth
  signOut: () => Promise<void>; // Sign out the current user
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider wraps the app and provides authentication state and actions
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session from Supabase on mount
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        // Log session details for debugging
        console.log("Initial session:", {
          hasSession: !!initialSession,
          userEmail: initialSession?.user?.email,
          accessToken: !!initialSession?.access_token,
        });

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for authentication state changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", {
        event,
        userEmail: currentSession?.user?.email,
        accessToken: !!currentSession?.access_token,
      });

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        router.push("/"); // Redirect to home on sign out
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, [router]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign up with email, password, and optional metadata
  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign in using Google OAuth provider
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/profile`, // Redirect after login
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Sign out the current user and clear session
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      router.push("/"); // Redirect to home after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Value provided to context consumers
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  // Only render children when not loading (prevents flicker)
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to access authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
