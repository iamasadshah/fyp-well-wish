"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaClock,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dialog } from "@headlessui/react";
import ChatWindow from "@/components/Chat/ChatWindow";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to render star ratings
const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
  }

  return stars;
};

interface Caregiver {
  id: string;
  name: string;
  image_url: string;
  bio: string;
  specialization: string;
  experience: string;
  hourly_rate: number;
  availability: string;
  rating: number;
  reviews_count: number;
  user_id?: string;
  booking_status?: "pending" | "accepted" | "paid" | null;
}

interface ActiveChat {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
}

const ITEMS_PER_PAGE = 6;

export default function FindCaregiver() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userCaregivers, setUserCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<
    Record<string, string>
  >({});
  const [specializationInput, setSpecializationInput] = useState("");
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const specInputRef = useRef<HTMLInputElement>(null);

  // Fetch caregivers from Supabase
  useEffect(() => {
    const fetchCaregivers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("caregivers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUserCaregivers(data || []);
      } catch (err) {
        console.error("Error fetching caregivers:", err);
        setError("Failed to load caregivers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaregivers();
  }, []);

  // Combine user caregivers with dummy data
  const allCaregivers = [...userCaregivers];

  // Get unique specializations for the filter dropdown
  const specializations = [
    "all",
    ...new Set(allCaregivers.map((caregiver) => caregiver.specialization)),
  ];

  // Filter caregivers based on search term and specialization
  const filteredCaregivers = allCaregivers.filter((caregiver) => {
    const matchesSearch =
      caregiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caregiver.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization =
      !specializationInput.trim() ||
      caregiver.specialization
        .toLowerCase()
        .includes(specializationInput.trim().toLowerCase());
    return matchesSearch && matchesSpecialization;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCaregivers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCaregivers = filteredCaregivers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Add this new useEffect to fetch booking statuses
  useEffect(() => {
    if (!user) return;

    const fetchBookingStatuses = async () => {
      try {
        const { data: bookings, error } = await supabase
          .from("bookings")
          .select("caregiver_id, status")
          .eq("sender_id", user.id);

        if (error) throw error;

        const statusMap: Record<string, string> = {};
        bookings.forEach((booking) => {
          statusMap[booking.caregiver_id] = booking.status;
        });

        setBookingStatuses(statusMap);
      } catch (err) {
        console.error("Error fetching booking statuses:", err);
      }
    };

    fetchBookingStatuses();

    // Subscribe to booking changes
    const subscription = supabase
      .channel("bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setBookingStatuses((prev) => ({
              ...prev,
              [payload.new.caregiver_id]: payload.new.status,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleBookNow = async (caregiver: Caregiver) => {
    if (!user) {
      router.push("/signup");
      return;
    }

    try {
      // Create a booking record
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          caregiver_id: caregiver.id,
          sender_id: user.id,
          status: "pending",
          amount: caregiver.hourly_rate,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create notification
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          sender_id: user.id,
          receiver_id: caregiver.user_id,
          caregiver_id: caregiver.id,
          booking_id: booking.id,
          type: "booking_request",
          message: `${
            user.email || "Someone"
          } wants to book your caregiving services.`,
        });

      if (notificationError) throw notificationError;
      setShowBookingPopup(true);
    } catch (err) {
      console.error("Error creating booking:", err);
    }
  };

  // Update the notification listener to handle booking acceptance
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new;

          if (notification.type === "booking_accepted") {
            // Show success notification
            const event = new CustomEvent("showNotification", {
              detail: {
                type: "success",
                message:
                  "Congratulations! Your booking has been accepted. Please discuss the work with the post owner using the chat button.",
              },
            });
            window.dispatchEvent(event);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const openChat = useCallback(
    (receiverId: string, receiverName: string, receiverAvatar?: string) => {
      // Check if chat is already open
      const existingChat = activeChats.find(
        (chat) => chat.receiverId === receiverId
      );
      if (!existingChat) {
        setActiveChats((prev) => [
          ...prev,
          { receiverId, receiverName, receiverAvatar },
        ]);
      } else {
        // If chat exists, bring it to front by reordering
        setActiveChats((prev) => [
          ...prev.filter((chat) => chat.receiverId !== receiverId),
          existingChat,
        ]);
      }
    },
    [activeChats]
  );

  // Add event listener for opening chat from notification
  useEffect(() => {
    const handleOpenChat = (event: CustomEvent) => {
      const { receiverId, receiverName, receiverAvatar } = event.detail;
      openChat(receiverId, receiverName, receiverAvatar);
    };

    window.addEventListener("openChat", handleOpenChat as EventListener);
    return () => {
      window.removeEventListener("openChat", handleOpenChat as EventListener);
    };
  }, [openChat]);

  const closeChat = (receiverId: string) => {
    setActiveChats((prev) =>
      prev.filter((chat) => chat.receiverId !== receiverId)
    );
  };

  // Move renderBookingButton inside the component
  const renderBookingButton = (caregiver: Caregiver) => {
    const status = bookingStatuses[caregiver.id];

    if (user?.id === caregiver.user_id) {
      return (
        <button
          disabled
          className="flex-1 px-4 py-2 text-center bg-gray-300 text-gray-400 cursor-not-allowed rounded-lg"
        >
          Your Profile
        </button>
      );
    }

    switch (status) {
      case "pending":
        return (
          <button
            disabled
            className="flex-1 px-4 py-2 text-center bg-gray-300 text-gray-600 rounded-lg"
          >
            Booking Sent
          </button>
        );
      case "accepted":
        return (
          <button
            disabled
            className="flex-1 px-4 py-2 text-center bg-green-100 text-green-600 rounded-lg"
          >
            Booking Accepted
          </button>
        );
      case "paid":
        return (
          <button
            disabled
            className="flex-1 px-4 py-2 text-center bg-blue-100 text-blue-600 rounded-lg"
          >
            Booking Confirmed
          </button>
        );
      default:
        return (
          <button
            onClick={() => handleBookNow(caregiver)}
            className="flex-1 px-4 py-2 text-center bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors duration-300"
          >
            Book Now
          </button>
        );
    }
  };

  const uniqueSpecs = Array.from(
    new Set(userCaregivers.map((c) => c.specialization).filter(Boolean))
  );

  const filteredSpecs = uniqueSpecs.filter((spec) =>
    spec.toLowerCase().includes(specializationInput.trim().toLowerCase())
  );

  const handleSpecSelect = (spec: string) => {
    setSelectedSpecialization(spec);
    setSpecializationInput(spec);
    setShowSpecDropdown(false);
  };

  const handleSpecInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecializationInput(e.target.value.trimStart());
    setShowSpecDropdown(true);
    setSelectedSpecialization("");
  };

  const handleClearSpec = () => {
    setSpecializationInput("");
    setSelectedSpecialization("all");
    setShowSpecDropdown(false);
    if (specInputRef.current) specInputRef.current.blur();
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
      {/* Booking Success Popup */}
      <Dialog
        open={showBookingPopup}
        onClose={() => setShowBookingPopup(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Booking Request Sent
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              Your booking request has been sent. Please wait for the caregiver
              to approve your request.
            </Dialog.Description>
            <button
              onClick={() => setShowBookingPopup(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Close
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Chat Windows */}
      <AnimatePresence mode="wait">
        {activeChats.map((chat, index) => (
          <ChatWindow
            key={`${chat.receiverId}-${index}`}
            receiverId={chat.receiverId}
            receiverName={chat.receiverName}
            receiverAvatar={chat.receiverAvatar}
            onClose={() => closeChat(chat.receiverId)}
          />
        ))}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Caregivers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find experienced and compassionate caregivers for your loved ones.
            Browse through our verified professionals and find the perfect match
            for your care needs.
          </p>
          {user && (
            <div className="mt-6 sm:mt-0 sm:absolute sm:top-0 sm:right-0">
              <button
                onClick={() => router.push("/post-caregiver")}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <span>Start Caring</span>
              </button>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <input
              ref={specInputRef}
              type="text"
              placeholder="Filter by specialization..."
              value={specializationInput}
              onChange={handleSpecInputChange}
              onFocus={() => setShowSpecDropdown(true)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {specializationInput && (
              <button
                type="button"
                onClick={handleClearSpec}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear"
              >
                ×
              </button>
            )}
            {showSpecDropdown && filteredSpecs.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredSpecs.map((spec) => (
                  <li
                    key={spec}
                    onClick={() => handleSpecSelect(spec)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                  >
                    {spec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Caregivers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {paginatedCaregivers.map((caregiver) => (
            <motion.div
              key={caregiver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile Image */}
                  <div className="relative w-32 h-32 mx-auto md:mx-0">
                    <Image
                      src={
                        caregiver.image_url || "/assets/caregivers/avatar1.jpg"
                      }
                      alt={caregiver.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>

                  {/* Caregiver Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {caregiver.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <div className="flex">
                          {renderStars(caregiver.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({caregiver.reviews_count} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 break-words max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded">
                      {caregiver.bio}
                    </p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                          {caregiver.specialization}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaClock className="text-gray-400" />
                        <span>{caregiver.experience}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaCalendarAlt className="text-gray-400" />
                        <span>{caregiver.availability}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaDollarSign className="text-gray-400" />
                        <span>${caregiver.hourly_rate}/hr</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          openChat(
                            caregiver.user_id || "",
                            caregiver.name,
                            caregiver.image_url
                          )
                        }
                        className={`flex-1 px-4 py-2 text-center border ${
                          user?.id === caregiver.user_id
                            ? "border-gray-300 text-gray-400 cursor-not-allowed"
                            : "border-blue-500 text-blue-500 hover:bg-blue-50"
                        } rounded-lg transition-colors duration-300`}
                        disabled={
                          user?.id === caregiver.user_id || !caregiver.user_id
                        }
                      >
                        Chat
                      </button>
                      {renderBookingButton(caregiver)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredCaregivers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No caregivers found matching your criteria.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
