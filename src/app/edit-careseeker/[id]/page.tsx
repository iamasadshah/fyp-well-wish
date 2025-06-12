"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import Toast from "@/components/ui/Toast";

interface CareseekerForm {
  name: string;
  bio: string;
  care_type: string;
  location: string;
  budget: number;
  availability: string;
  image: File | null;
}

const careTypes = [
  "Elder Care",
  "Child Care",
  "Special Needs Care",
  "Post-Surgery Care",
  "Palliative Care",
];

const availabilities = [
  "Full-time",
  "Part-time",
  "Weekends only",
  "Evenings only",
  "Flexible hours",
];

export default function EditCareseekerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    bio?: string;
    care_type?: string;
    location?: string;
    budget?: string;
    availability?: string;
  }>({});
  const [formData, setFormData] = useState<CareseekerForm>({
    name: "",
    bio: "",
    care_type: "",
    location: "",
    budget: 0,
    availability: "",
    image: null,
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching careseeker data for ID:", resolvedParams.id);

        const { data, error } = await supabase
          .from("careseekers")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) {
          console.error("Error fetching data:", error);
          throw error;
        }

        if (!data) {
          console.error("No data found for ID:", resolvedParams.id);
          throw new Error("No data found");
        }

        console.log("Fetched data:", data);

        if (data.user_id !== user.id) {
          console.log("User ID mismatch:", {
            dataUserId: data.user_id,
            currentUserId: user.id,
          });
          router.push("/profile");
          return;
        }

        // Update form data with existing values, mapping title to name and description to bio
        const updatedFormData = {
          name: data.title || "",
          bio: data.description || "",
          care_type: data.care_type || "",
          location: data.location || "",
          budget: data.budget || 0,
          availability: data.duration || "", // Map duration to availability
          image: null,
        };

        console.log("Setting form data:", updatedFormData);
        setFormData(updatedFormData);

        // Set image preview if exists
        if (data.image_url) {
          console.log("Setting image preview:", data.image_url);
          setImagePreview(data.image_url);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setToast({
          message: "Failed to load post data",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchPost();
    }
  }, [user, resolvedParams.id, router]);

  // Add a debug effect to monitor form data changes
  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);

  const validateForm = () => {
    const errors: {
      name?: string;
      bio?: string;
      care_type?: string;
      location?: string;
      budget?: string;
      availability?: string;
    } = {};

    if (!formData.name) errors.name = "Name is required";
    if (!formData.bio) errors.bio = "Bio is required";
    if (!formData.care_type) errors.care_type = "Care type is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.budget) errors.budget = "Budget is required";
    if (!formData.availability)
      errors.availability = "Availability is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setToast({
          message: "Image size should be less than 5MB",
          type: "error",
        });
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    console.log("Input change:", { name, value });
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: name === "budget" ? parseFloat(value) || 0 : value,
      };
      console.log("Updated form data:", newData);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      let imageUrl = imagePreview;

      if (formData.image) {
        const fileExt = formData.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("careseeker-images")
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("careseeker-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("careseekers")
        .update({
          title: formData.name, // Map name back to title
          description: formData.bio, // Map bio back to description
          care_type: formData.care_type,
          location: formData.location,
          budget: formData.budget,
          duration: formData.availability, // Map availability back to duration
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setToast({
        message: "Profile updated successfully",
        type: "success",
      });

      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({
        message: "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b4d8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00b4d8] to-[#0096b7] px-6 py-8 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Edit Careseeker Profile
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Update your care requirements and preferences
                </p>
              </div>
              <button
                onClick={() => router.push("/profile")}
                className="text-white hover:text-blue-50 text-sm font-medium flex items-center gap-2 transition-colors duration-200"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back to Profile
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Profile Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-white border-2 border-dashed border-gray-200 shadow-sm">
                    <Image
                      src={imagePreview || "/assets/placeholder.jpg"}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <label className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200 w-full sm:w-auto">
                      <FiUpload className="w-5 h-5 mr-2" />
                      Change Profile Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500">
                      Recommended size: 800x800px. Max file size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 ${
                        formErrors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Enter your full name"
                    />
                    {formErrors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Care Type */}
                  <div>
                    <label
                      htmlFor="care_type"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Type of Care Needed
                    </label>
                    <select
                      id="care_type"
                      name="care_type"
                      value={formData.care_type}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1rem_center] ${
                        formErrors.care_type
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      }}
                    >
                      <option value="">Select type of care needed</option>
                      {careTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {formErrors.care_type && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.care_type}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 ${
                        formErrors.location
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Enter your location"
                    />
                    {formErrors.location && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Care Requirements
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 resize-none ${
                        formErrors.bio
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      placeholder="Describe your care requirements and preferences"
                    />
                    {formErrors.bio && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.bio}
                      </p>
                    )}
                  </div>

                  {/* Budget */}
                  <div>
                    <label
                      htmlFor="budget"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Monthly Budget
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="budget"
                        name="budget"
                        min="0"
                        step="0.01"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className={`block w-full pl-8 pr-12 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 ${
                          formErrors.budget
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">/month</span>
                      </div>
                    </div>
                    {formErrors.budget && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.budget}
                      </p>
                    )}
                  </div>

                  {/* Availability */}
                  <div>
                    <label
                      htmlFor="availability"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Required Availability
                    </label>
                    <select
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1rem_center] ${
                        formErrors.availability
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      }}
                    >
                      <option value="">Select required availability</option>
                      {availabilities.map((avail) => (
                        <option key={avail} value={avail}>
                          {avail}
                        </option>
                      ))}
                    </select>
                    {formErrors.availability && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formErrors.availability}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#00b4d8] to-[#0096b7] hover:from-[#0096b7] hover:to-[#0084a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00b4d8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating Profile...
                    </div>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast */}
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
