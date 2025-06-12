"use client";
import UserProfile from "@/components/auth/UserProfile";
import UserPosts from "@/components/profile/UserPosts";
import ApplicationsManager from "@/components/profile/ApplicationsManager";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b4d8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <UserProfile />
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
          <ApplicationsManager />
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Posts</h2>
          <UserPosts />
        </div>
      </div>
    </div>
  );
}
