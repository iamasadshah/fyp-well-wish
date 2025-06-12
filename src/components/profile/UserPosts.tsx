"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Toast from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

type CaregiverPost = {
  id: string;
  name: string;
  bio: string;
  specialization: string;
  experience: string;
  hourly_rate: number;
  availability: string;
  image_url: string;
  rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
};

type CareseekerPost = {
  id: string;
  title: string;
  description: string;
  care_type: string;
  location: string;
  budget: number;
  duration: string;
  image_url: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

function isCaregiverPost(
  post: CaregiverPost | CareseekerPost
): post is CaregiverPost {
  return (post as CaregiverPost).name !== undefined;
}

export default function UserPosts() {
  const { user } = useAuth();
  const router = useRouter();
  const [caregiverPosts, setCaregiverPosts] = useState<CaregiverPost[]>([]);
  const [careseekerPosts, setCareseekerPosts] = useState<CareseekerPost[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    id: string;
    type: "caregiver" | "careseeker";
  } | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!user) return;

    try {
      const { data: caregiverData, error: caregiverError } = await supabase
        .from("caregivers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (caregiverError) throw caregiverError;

      const { data: careseekerData, error: careseekerError } = await supabase
        .from("careseekers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (careseekerError) throw careseekerError;

      setCaregiverPosts(caregiverData || []);
      setCareseekerPosts(careseekerData || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setToast({
        message: "Failed to load posts",
        type: "error",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const handleEdit = (postId: string, type: "caregiver" | "careseeker") => {
    if (type === "caregiver") {
      router.push(`/edit-caregiver/${postId}`);
    } else {
      router.push(`/edit-careseeker/${postId}`);
    }
  };

  const handleDeleteClick = (
    postId: string,
    type: "caregiver" | "careseeker"
  ) => {
    setPostToDelete({ id: postId, type });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    const { id, type } = postToDelete;

    try {
      const table = type === "caregiver" ? "caregivers" : "careseekers";
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      setToast({
        message: "Post deleted successfully",
        type: "success",
      });

      // Refresh posts
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      setToast({
        message: "Failed to delete post",
        type: "error",
      });
    } finally {
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const renderPostCard = (
    post: CaregiverPost | CareseekerPost,
    type: "caregiver" | "careseeker"
  ) => (
    <div
      key={post.id}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 mx-auto sm:mx-0">
          <Image
            src={
              isCaregiverPost(post)
                ? post.image_url || "/assets/caregivers/avatar1.jpg"
                : post.image_url || "/assets/careseekers/avatar1.jpg"
            }
            alt={isCaregiverPost(post) ? post.name : post.title}
            fill
            className="rounded-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 w-full text-center sm:text-left">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {isCaregiverPost(post) ? post.name : post.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {isCaregiverPost(post) ? post.bio : post.description}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
              {isCaregiverPost(post) ? post.specialization : post.care_type}
            </span>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
              {isCaregiverPost(post)
                ? `$${post.hourly_rate}/hr`
                : `$${post.budget}/hr`}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={() => handleEdit(post.id, type)}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(post.id, type)}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors border border-red-600 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {caregiverPosts.length > 0 ? (
          caregiverPosts.map((post) => renderPostCard(post, "caregiver"))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Caregiver Posts
              </h3>
              <p className="text-sm text-gray-500">
                You haven&apos;t created any caregiver posts yet.
              </p>
            </div>
          </div>
        )}
        {careseekerPosts.length > 0 ? (
          careseekerPosts.map((post) => renderPostCard(post, "careseeker"))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Care Seeker Posts
              </h3>
              <p className="text-sm text-gray-500">
                You haven&apos;t created any care seeker posts yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-filter backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this {postToDelete.type} post?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
