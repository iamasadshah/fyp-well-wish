"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import Toast from "@/components/ui/Toast";

interface CaregiverForm {
  name: string;
  bio: string;
  specialization: string;
  experience: string;
  hourly_rate: number;
  availability: string;
  image: File | null;
}

const specializations = [
  "Elder Care",
  "Child Care",
  "Special Needs Care",
  "Post-Surgery Care",
  "Palliative Care",
];

const experiences = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "More than 10 years",
];

const availabilities = [
  "Full-time",
  "Part-time",
  "Weekends only",
  "Evenings only",
  "Flexible hours",
];

export default function EditCaregiverPage({
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
    specialization?: string;
    experience?: string;
    hourly_rate?: string;
    availability?: string;
  }>({});
  const [formData, setFormData] = useState<CaregiverForm>({
    name: "",
    bio: "",
    specialization: "",
    experience: "",
    hourly_rate: 0,
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
        const { data, error } = await supabase
          .from("caregivers")
          .select("*")
          .eq("id", resolvedParams.id)
          .single();

        if (error) throw error;

        if (data.user_id !== user.id) {
          router.push("/profile");
          return;
        }

        setFormData({
          name: data.name,
          bio: data.bio,
          specialization: data.specialization,
          experience: data.experience,
          hourly_rate: data.hourly_rate,
          availability: data.availability,
          image: null,
        });
        setImagePreview(data.image_url);
      } catch (error) {
        console.error("Error fetching post:", error);
        setToast({
          message: "Failed to load post",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [user, resolvedParams.id, router]);

  const validateForm = () => {
    const errors: {
      name?: string;
      bio?: string;
      specialization?: string;
      experience?: string;
      hourly_rate?: string;
      availability?: string;
    } = {};

    if (!formData.name) errors.name = "Name is required";
    if (!formData.bio) errors.bio = "Bio is required";
    if (!formData.specialization)
      errors.specialization = "Specialization is required";
    if (!formData.experience) errors.experience = "Experience is required";
    if (!formData.hourly_rate) errors.hourly_rate = "Hourly rate is required";
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "hourly_rate" ? parseFloat(value) || 0 : value,
    }));
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
          .from("caregiver-images")
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("caregiver-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("caregivers")
        .update({
          name: formData.name,
          bio: formData.bio,
          specialization: formData.specialization,
          experience: formData.experience,
          hourly_rate: formData.hourly_rate,
          availability: formData.availability,
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
                  Edit Caregiver Profile
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Update your professional information and availability
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

                  {/* Specialization */}
                  <div>
                    <label
                      htmlFor="specialization"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Specialization
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1rem_center] ${
                        formErrors.specialization
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      }}
                    >
                      <option value="">Select your specialization</option>
                      {specializations.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {formErrors.specialization && (
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
                        {formErrors.specialization}
                      </p>
                    )}
                  </div>

                  {/* Experience */}
                  <div>
                    <label
                      htmlFor="experience"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Experience Level
                    </label>
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`block w-full px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-[length:1.5em_1.5em] bg-[right_1rem_center] ${
                        formErrors.experience
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      }}
                    >
                      <option value="">Select your experience level</option>
                      {experiences.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                    {formErrors.experience && (
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
                        {formErrors.experience}
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
                      Professional Bio
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
                      placeholder="Tell us about your caregiving experience and expertise"
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

                  {/* Hourly Rate */}
                  <div>
                    <label
                      htmlFor="hourly_rate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Hourly Rate
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="hourly_rate"
                        name="hourly_rate"
                        min="0"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        className={`block w-full pl-8 pr-12 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 focus:outline-none transition-all duration-200 ${
                          formErrors.hourly_rate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : ""
                        }`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">/hr</span>
                      </div>
                    </div>
                    {formErrors.hourly_rate && (
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
                        {formErrors.hourly_rate}
                      </p>
                    )}
                  </div>

                  {/* Availability */}
                  <div>
                    <label
                      htmlFor="availability"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Availability
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
                      <option value="">Select your availability</option>
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
