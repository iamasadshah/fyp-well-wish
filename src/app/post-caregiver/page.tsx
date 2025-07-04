"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import Toast from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CaregiverForm {
  name: string;
  bio: string;
  specialization: string;
  experience: string;
  hourlyRate: number;
  availability: {
    startDay: string;
    endDay: string;
  };
  image: File | null;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function PostCaregiver() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CaregiverForm, string>>
  >({});
  const [customSpecialization, setCustomSpecialization] = useState("");

  const [formData, setFormData] = useState<CaregiverForm>({
    name: "",
    bio: "",
    specialization: "",
    experience: "",
    hourlyRate: 0,
    availability: {
      startDay: "",
      endDay: "",
    },
    image: null,
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CaregiverForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length < 50) {
      newErrors.bio = "Bio must be at least 50 characters long";
    }

    if (!formData.specialization) {
      newErrors.specialization = "Please enter a specialization";
    }

    if (!formData.experience.trim()) {
      newErrors.experience = "Experience is required";
    }

    if (!formData.hourlyRate || formData.hourlyRate <= 0) {
      newErrors.hourlyRate = "Please enter a valid hourly rate";
    }

    if (!formData.availability.startDay || !formData.availability.endDay) {
      newErrors.availability = "Please select your availability";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, bio: e.target.value });
  };

  const handleSpecializationChange = (value: string) => {
    if (value === "Other") {
      setFormData({ ...formData, specialization: "" });
    } else {
      setFormData({ ...formData, specialization: value });
      setCustomSpecialization("");
    }
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, experience: e.target.value });
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, hourlyRate: Number(e.target.value) });
  };

  const handleAvailabilityChange = (
    type: "startDay" | "endDay",
    value: string
  ) => {
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [type]: value,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToast({ message: "Please login to post a caregiver", type: "error" });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = "";
      if (formData.image) {
        try {
          const fileExt = formData.image.name.split(".").pop();
          const fileName = `${Date.now()}.${fileExt}`;

          console.log("Attempting to upload image:", {
            fileName,
            fileSize: formData.image.size,
            fileType: formData.image.type,
          });

          const { error: uploadError, data } = await supabase.storage
            .from("caregiver-images")
            .upload(fileName, formData.image);

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw uploadError;
          }

          console.log("Image uploaded successfully:", data);

          const {
            data: { publicUrl },
          } = supabase.storage.from("caregiver-images").getPublicUrl(fileName);

          imageUrl = publicUrl;
          console.log("Public URL generated:", publicUrl);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new Error("Failed to upload image. Please try again.");
        }
      }

      // Log the caregiver data being inserted
      const caregiverData = {
        user_id: user.id,
        name: formData.name,
        bio: formData.bio,
        specialization: formData.specialization,
        experience: formData.experience,
        hourly_rate: formData.hourlyRate,
        availability:
          formData.availability.startDay + " - " + formData.availability.endDay,
        image_url: imageUrl,
        rating: 0,
        reviews_count: 0,
        created_at: new Date().toISOString(),
      };

      console.log("Attempting to insert caregiver data:", caregiverData);

      const { error: insertError, data: insertedData } = await supabase
        .from("caregivers")
        .insert([caregiverData])
        .select();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }

      console.log("Caregiver data inserted successfully:", insertedData);

      setToast({ message: "Caregiver posted successfully!", type: "success" });
      router.push("/find-caregiver");
    } catch (error: unknown) {
      console.error("Error posting caregiver:", error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to post caregiver. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Caregiver</h1>
          <p className="mt-2 text-gray-600">
            Share your caregiving services with our community
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-sm"
        >
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile preview"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <FiUpload className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors duration-300 flex items-center gap-2">
              <FiUpload className="w-4 h-4" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Recommended: Square image, max 5MB
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                className={cn("pl-10", errors.name && "border-red-300")}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={handleBioChange}
                className={cn(
                  "pl-10 min-h-[100px]",
                  errors.bio && "border-red-300"
                )}
                placeholder="Tell us about your experience and expertise..."
              />
            </div>
            {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
            <p className="text-sm text-gray-500">Minimum 50 characters</p>
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              placeholder="Enter your specialization (e.g., Elderly Care, Pediatric Care, etc.)"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              className={cn(errors.specialization && "border-red-300")}
              required
            />
            {errors.specialization && (
              <p className="text-sm text-red-600">{errors.specialization}</p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="experience"
                value={formData.experience}
                onChange={handleExperienceChange}
                className={cn("pl-10", errors.experience && "border-red-300")}
                placeholder="e.g., 5 years experience in elderly care"
              />
            </div>
            {errors.experience && (
              <p className="text-sm text-red-600">{errors.experience}</p>
            )}
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter hourly rate"
              value={formData.hourlyRate === 0 ? "" : formData.hourlyRate}
              onChange={handleHourlyRateChange}
              className="w-full"
            />
          </div>
          {errors.hourlyRate && (
            <p className="text-sm text-red-600">{errors.hourlyRate}</p>
          )}

          {/* Availability */}
          <div className="space-y-4">
            <Label>Availability</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDay">Available From</Label>
                <Select
                  value={formData.availability.startDay}
                  onValueChange={(value) =>
                    handleAvailabilityChange("startDay", value)
                  }
                >
                  <SelectTrigger
                    id="startDay"
                    className={cn(
                      "w-full bg-white border border-gray-200",
                      errors.availability && "border-red-300"
                    )}
                  >
                    <SelectValue placeholder="Select start day" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDay">Available To</Label>
                <Select
                  value={formData.availability.endDay}
                  onValueChange={(value) =>
                    handleAvailabilityChange("endDay", value)
                  }
                >
                  <SelectTrigger
                    id="endDay"
                    className={cn(
                      "w-full bg-white border border-gray-200",
                      errors.availability && "border-red-300"
                    )}
                  >
                    <SelectValue placeholder="Select end day" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {errors.availability && (
              <p className="text-sm text-red-600">{errors.availability}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <span>Post Caregiver</span>
              )}
            </Button>
          </div>
        </form>
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
