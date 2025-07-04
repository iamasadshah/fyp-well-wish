"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import { toast } from "react-hot-toast";

interface CareSeeker {
  id: string;
  user_id: string;
  title: string;
  description: string;
  care_type: string;
  location: string;
  budget: number;
  duration: string;
  image_url: string;
  status: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 12;

export default function FindCareSeeker() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWork, setSelectedWork] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [careSeekers, setCareSeekers] = useState<CareSeeker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedPosts, setAppliedPosts] = useState<Set<string>>(new Set());
  const [sendingEmails, setSendingEmails] = useState<Set<string>>(new Set());
  const [workTypeInput, setWorkTypeInput] = useState("");
  const [showWorkDropdown, setShowWorkDropdown] = useState(false);
  const workInputRef = useRef<HTMLInputElement>(null);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_ID || "");
  }, []);

  // Load applied posts from localStorage
  useEffect(() => {
    const savedAppliedPosts = localStorage.getItem("appliedPosts");
    if (savedAppliedPosts) {
      setAppliedPosts(new Set(JSON.parse(savedAppliedPosts)));
    }
  }, []);

  // Save applied posts to localStorage
  useEffect(() => {
    localStorage.setItem("appliedPosts", JSON.stringify([...appliedPosts]));
  }, [appliedPosts]);

  // Handle email sending
  const handleSendEmail = async (seeker: CareSeeker) => {
    if (!user) {
      toast.error("Please sign up to apply for this position");
      router.push("/signup");
      return;
    }

    if (appliedPosts.has(seeker.id)) {
      toast.error("You have already applied for this position");
      return;
    }

    try {
      // Add this post ID to sending state
      setSendingEmails((prev) => new Set([...prev, seeker.id]));

      // Get user profile from Supabase
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Get post owner's profile information
      const { data: postOwnerProfile, error: ownerError } = await supabase
        .from("profiles")
        .select("contact_number, full_name")
        .eq("id", seeker.user_id)
        .single();

      if (ownerError) throw ownerError;

      // Create notification in Supabase
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          sender_id: user.id, // Current user's ID
          receiver_id: seeker.user_id, // Post owner's ID
          type: "application",
          message: `${
            userProfile.full_name || "A caregiver"
          } is interested in your care position for ${seeker.care_type} in ${
            seeker.location
          }`,
          metadata: {
            post_id: seeker.id,
            care_type: seeker.care_type,
            location: seeker.location,
            budget: seeker.budget,
            duration: seeker.duration,
          },
        });

      if (notificationError) throw notificationError;

      // Prepare email template parameters
      const templateParams = {
        to_email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "", // Send to admin email
        to_name: seeker.title,
        from_name: userProfile.full_name || "A Caregiver",
        message: `Hello,

A caregiver is interested in your care position for ${seeker.care_type} in ${
          seeker.location
        }.

Position Details:
- Title: ${seeker.title}
- Care Type: ${seeker.care_type}
- Location: ${seeker.location}
- Budget: $${seeker.budget}
- Duration: ${seeker.duration}

Caregiver Details:
- Name: ${userProfile.full_name || "Not provided"}
- Contact: ${userProfile.contact_number || "Not provided"}
- Location: ${userProfile.location || "Not provided"}

Post Owner Details:
- Name: ${postOwnerProfile.full_name || "Not provided"}
- Contact: ${postOwnerProfile.contact_number || "Not provided"}

Please contact the caregiver through the WellWish platform to discuss this opportunity further.

Best regards,
WellWish Team`,
      };

      // Send email using EmailJS
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
        templateParams
      );

      // Update applied posts
      setAppliedPosts((prev) => new Set([...prev, seeker.id]));
      toast.success("Application sent successfully!");
    } catch (error) {
      console.error("Error sending application:", error);
      toast.error("Failed to send application. Please try again.");
    } finally {
      // Remove this post ID from sending state
      setSendingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(seeker.id);
        return newSet;
      });
    }
  };

  // Fetch care seekers from Supabase
  useEffect(() => {
    const fetchCareSeekers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("careseekers")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCareSeekers(data || []);
      } catch (err) {
        console.error("Error fetching care seekers:", err);
        setError("Failed to load care seekers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCareSeekers();
  }, []);

  // Get unique work types for the filter dropdown
  const workTypes = [
    "all",
    ...new Set(careSeekers.map((seeker) => seeker.care_type)),
  ];

  // Filter care seekers based on search term and work type
  const filteredCareSeekers = careSeekers.filter((seeker) => {
    const matchesSearch = seeker.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesWork =
      !workTypeInput.trim() ||
      seeker.care_type
        .toLowerCase()
        .includes(workTypeInput.trim().toLowerCase());
    return matchesSearch && matchesWork;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCareSeekers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCareSeekers = filteredCareSeekers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uniqueWorkTypes = Array.from(
    new Set(careSeekers.map((s) => s.care_type).filter(Boolean))
  );

  const filteredWorkTypes = uniqueWorkTypes.filter((work) =>
    work.toLowerCase().includes(workTypeInput.trim().toLowerCase())
  );

  const handleWorkSelect = (work: string) => {
    setSelectedWork(work);
    setWorkTypeInput(work);
    setShowWorkDropdown(false);
  };

  const handleWorkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkTypeInput(e.target.value.trimStart());
    setShowWorkDropdown(true);
    setSelectedWork("");
  };

  const handleClearWork = () => {
    setWorkTypeInput("");
    setSelectedWork("all");
    setShowWorkDropdown(false);
    if (workInputRef.current) workInputRef.current.blur();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Care Opportunities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse through care opportunities and find the perfect match for
            your caregiving skills. Connect with care seekers and start making a
            difference.
          </p>
          {user && (
            <div className="mt-6 sm:mt-0 sm:absolute sm:top-0 sm:right-0">
              <button
                onClick={() => router.push("/post-careseeker")}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <span>Post a Need</span>
              </button>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <input
              ref={workInputRef}
              type="text"
              placeholder="Filter by work type..."
              value={workTypeInput}
              onChange={handleWorkInputChange}
              onFocus={() => setShowWorkDropdown(true)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {workTypeInput && (
              <button
                type="button"
                onClick={handleClearWork}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear"
              >
                ×
              </button>
            )}
            {showWorkDropdown && filteredWorkTypes.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredWorkTypes.map((work) => (
                  <li
                    key={work}
                    onClick={() => handleWorkSelect(work)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                  >
                    {work}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Care Seekers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedCareSeekers.map((seeker) => (
            <div
              key={seeker.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                {/* Profile Image with Background */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full"></div>
                  <Image
                    src={seeker.image_url || "/assets/careseekers/avatar1.jpg"}
                    alt={seeker.title}
                    fill
                    className="rounded-full object-cover p-1"
                  />
                </div>

                {/* Care Seeker Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {seeker.title}
                  </h3>
                  <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                    {seeker.care_type}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-gray-600 text-center leading-relaxed">
                    {seeker.description}
                  </p>
                </div>

                {/* Additional Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-700 font-medium">
                        Budget: ${seeker.budget}
                      </p>
                    </div>
                    {seeker.duration && (
                      <div className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-gray-700 font-medium">
                          Duration: {seeker.duration}
                        </p>
                      </div>
                    )}
                    {seeker.location && (
                      <div className="flex items-center justify-center gap-2">
                        <svg
                          className="w-5 h-5 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <p className="text-gray-700 font-medium">
                          {seeker.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Button */}
                <button
                  onClick={() => handleSendEmail(seeker)}
                  disabled={
                    user?.id === seeker.user_id ||
                    sendingEmails.has(seeker.id) ||
                    appliedPosts.has(seeker.id)
                  }
                  className={`block w-full px-6 py-3 text-center rounded-xl font-semibold shadow-sm transition-colors duration-300 ${
                    user?.id === seeker.user_id
                      ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                      : appliedPosts.has(seeker.id)
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                  }`}
                >
                  {sendingEmails.has(seeker.id)
                    ? "Sending..."
                    : appliedPosts.has(seeker.id)
                    ? "Applied ✓"
                    : "I'm Available!"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {paginatedCareSeekers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg font-medium">
              No care seekers found matching your criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
