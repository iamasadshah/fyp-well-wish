"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import Toast from "@/components/ui/Toast";
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
import { cn } from "@/lib/utils";

interface CareSeekerForm {
  title: string;
  description: string;
  care_type: string;
  location: string;
  budget: number;
  duration: string;
  image: File | null;
}

const durations = [
  "One-time",
  "Short-term (1-2 weeks)",
  "Medium-term (1-3 months)",
  "Long-term (3+ months)",
];

export default function PostCareSeeker() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<CareSeekerForm>({
    title: "",
    description: "",
    care_type: "",
    location: "",
    budget: 0,
    duration: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CareSeekerForm, string>>
  >({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CareSeekerForm, string>> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim() || formData.description.length < 50)
      newErrors.description = "Description must be at least 50 characters";
    if (!formData.care_type.trim())
      newErrors.care_type = "Care type is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.budget || formData.budget <= 0)
      newErrors.budget = "Budget is required";
    if (!formData.duration.trim()) newErrors.duration = "Duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) || 0 : value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validateForm()) return;

    try {
      let imageUrl = "";

      if (formData.image instanceof File) {
        const fileExt = formData.image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("careseeker-images")
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("careseeker-images").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("careseekers").insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          care_type: formData.care_type,
          location: formData.location,
          budget: formData.budget,
          duration: formData.duration,
          image_url: imageUrl,
          status: "active",
        },
      ]);

      if (error) throw error;

      setToast({ message: "Care need posted successfully!", type: "success" });
      router.push("/find-careseeker");
    } catch (error: unknown) {
      console.error("Error posting care need:", error);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to post care need. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a Care Need</h1>
          <p className="mt-2 text-gray-600">
            Share your care requirements with our community
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={cn("pl-10")}
                placeholder="Enter a descriptive title"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={cn("pl-10 min-h-[100px]")}
                placeholder="Describe your care needs in detail..."
              />
            </div>
            <p className="text-sm text-gray-500">Minimum 50 characters</p>
          </div>

          {/* Care Type */}
          <div className="space-y-2">
            <Label htmlFor="care_type">Care Type</Label>
            <Input
              id="care_type"
              name="care_type"
              placeholder="Enter the type of care needed (e.g., Elderly Care, Child Care, etc.)"
              value={formData.care_type}
              onChange={handleInputChange}
              className={cn(errors?.care_type && "border-red-300")}
              required
            />
            {errors?.care_type && (
              <p className="text-sm text-red-600">{errors.care_type}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={cn("pl-10")}
                placeholder="Enter your location"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiArrowLeft className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget === 0 ? "" : formData.budget}
                onChange={handleInputChange}
                className={cn("pl-10")}
                placeholder="Enter your budget"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "duration", value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger
                id="duration"
                className="w-full bg-white border border-gray-200"
              >
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                {durations.map((duration) => (
                  <SelectItem key={duration} value={duration}>
                    {duration}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto">
              <span>Post Care Need</span>
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
