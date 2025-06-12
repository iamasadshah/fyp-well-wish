"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { FiEdit2, FiSave, FiX, FiUpload } from "react-icons/fi";
import Toast from "../ui/Toast";

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  website: string;
  contact_number: string;
  nationality: string;
  avatar_url: string | null;
  occupations: string[];
  skills: string[];
  languages: string[];
}

export default function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    id: user?.id || "",
    full_name: "",
    avatar_url: null,
    bio: "",
    website: "",
    contact_number: "",
    nationality: "",
    occupations: [],
    skills: [],
    languages: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const getProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, create one
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user?.id,
                username: user?.email?.split("@")[0] || "",
                full_name: "",
                avatar_url: "",
                bio: "",
                website: "",
                contact_number: "",
                nationality: "",
                location: "",
                occupation: "",
                skills: [],
                languages: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            throw insertError;
          }

          // Fetch the newly created profile
          const { data: newData, error: newError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user?.id)
            .single();

          if (newError) {
            throw newError;
          }

          setProfile(newData);
          setAvatarPreview(newData.avatar_url || "");
        } else {
          throw error;
        }
      } else if (data) {
        setProfile(data);
        setAvatarPreview(data.avatar_url || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (user?.id) {
      getProfile();
    }
  }, [user?.id, getProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user?.id) return null;

    try {
      setIsUploading(true);
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setToast({
        message: "Failed to upload avatar",
        type: "error",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const updateProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile?.full_name,
        bio: profile?.bio,
        website: profile?.website,
        contact_number: profile?.contact_number,
        nationality: profile?.nationality,
        avatar_url: avatarUrl,
        occupations: profile?.occupations || [],
        skills: profile?.skills || [],
        languages: profile?.languages || [],
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setToast({
        message: "Profile updated successfully",
        type: "success",
      });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({
        message: "Failed to update profile",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Profile Header with Gradient */}
          <div className="relative h-72 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="absolute -bottom-28 left-8">
              <div className="relative group">
                <div className="w-56 h-56 rounded-2xl border-4 border-white/90 overflow-hidden bg-white shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl">
                  {avatarPreview || profile?.avatar_url ? (
                    <Image
                      src={avatarPreview || profile?.avatar_url || ""}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-7xl font-bold text-slate-400">
                        {profile?.full_name?.[0] || user.email?.[0] || "?"}
                      </span>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg cursor-pointer hover:bg-white transition-all duration-300 hover:scale-110 hover:shadow-xl"
                  >
                    <FiUpload className="w-6 h-6 text-blue-600" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-32 pb-12 px-8">
            {/* Profile Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  {profile?.full_name || "Your Name"}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <p className="text-gray-600 text-lg">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {isEditing ? (
                  <>
                    <FiX className="w-5 h-5 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <FiEdit2 className="w-5 h-5 mr-2" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            {/* Profile Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile?.full_name || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              full_name: e.target.value,
                            }))
                          }
                          disabled={!isEditing}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 text-lg placeholder:text-slate-400 bg-white/50 backdrop-blur-sm shadow-sm"
                          placeholder="Enter your full name"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Nationality
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={profile?.nationality || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              nationality: e.target.value,
                            }))
                          }
                          disabled={!isEditing}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 text-lg placeholder:text-slate-400 bg-white/50 backdrop-blur-sm shadow-sm"
                          placeholder="Enter your nationality"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Website
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={profile?.website || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              website: e.target.value,
                            }))
                          }
                          disabled={!isEditing}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 text-lg placeholder:text-slate-400 bg-white/50 backdrop-blur-sm shadow-sm"
                          placeholder="https://your-website.com"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Contact Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={profile?.contact_number || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              contact_number: e.target.value,
                            }))
                          }
                          disabled={!isEditing}
                          className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 text-lg placeholder:text-slate-400 bg-white/50 backdrop-blur-sm shadow-sm"
                          placeholder="Enter your contact number"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    About Me
                  </h2>
                  <div className="group">
                    <div className="relative">
                      <textarea
                        value={profile?.bio || ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 text-lg placeholder:text-slate-400 bg-white/50 backdrop-blur-sm shadow-sm resize-none"
                        placeholder="Tell us about yourself..."
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/5 group-focus-within:via-blue-500/10 group-focus-within:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Skills & Expertise */}
              <div className="space-y-8">
                {/* Skills & Expertise Card */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Skills & Expertise
                  </h2>
                  <div className="space-y-8">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Occupations
                      </label>
                      <div className="relative">
                        <div className="flex flex-wrap gap-2 p-2 min-h-[3.5rem] rounded-xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
                          {profile?.occupations?.map((occupation, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
                            >
                              {occupation}
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    setProfile((prev) => ({
                                      ...prev,
                                      occupations: prev.occupations?.filter(
                                        (_, i) => i !== index
                                      ),
                                    }));
                                  }}
                                  className="ml-2 text-blue-500 hover:text-blue-700"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {isEditing && (
                            <input
                              type="text"
                              placeholder="Add occupation..."
                              className="flex-1 min-w-[120px] bg-transparent border-none focus:ring-0 p-0 text-lg placeholder:text-slate-400"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const value = (
                                    e.target as HTMLInputElement
                                  ).value.trim();
                                  if (value) {
                                    setProfile((prev) => ({
                                      ...prev,
                                      occupations: [
                                        ...(prev.occupations || []),
                                        value,
                                      ],
                                    }));
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 italic mt-2">
                        Press Enter or comma to add an occupation
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Skills
                      </label>
                      <div className="relative">
                        <div className="flex flex-wrap gap-2 p-2 min-h-[3.5rem] rounded-xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
                          {profile?.skills?.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium"
                            >
                              {skill}
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    setProfile((prev) => ({
                                      ...prev,
                                      skills: prev.skills?.filter(
                                        (_, i) => i !== index
                                      ),
                                    }));
                                  }}
                                  className="ml-2 text-indigo-500 hover:text-indigo-700"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {isEditing && (
                            <input
                              type="text"
                              placeholder="Add skill..."
                              className="flex-1 min-w-[120px] bg-transparent border-none focus:ring-0 p-0 text-lg placeholder:text-slate-400"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const value = (
                                    e.target as HTMLInputElement
                                  ).value.trim();
                                  if (value) {
                                    setProfile((prev) => ({
                                      ...prev,
                                      skills: [...(prev.skills || []), value],
                                    }));
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 italic mt-2">
                        Press Enter or comma to add a skill
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 group-focus-within:text-blue-600 transition-colors duration-200">
                        Languages
                      </label>
                      <div className="relative">
                        <div className="flex flex-wrap gap-2 p-2 min-h-[3.5rem] rounded-xl border-2 border-slate-200 bg-white/50 backdrop-blur-sm">
                          {profile?.languages?.map((language, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium"
                            >
                              {language}
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    setProfile((prev) => ({
                                      ...prev,
                                      languages: prev.languages?.filter(
                                        (_, i) => i !== index
                                      ),
                                    }));
                                  }}
                                  className="ml-2 text-purple-500 hover:text-purple-700"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {isEditing && (
                            <input
                              type="text"
                              placeholder="Add language..."
                              className="flex-1 min-w-[120px] bg-transparent border-none focus:ring-0 p-0 text-lg placeholder:text-slate-400"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const value = (
                                    e.target as HTMLInputElement
                                  ).value.trim();
                                  if (value) {
                                    setProfile((prev) => ({
                                      ...prev,
                                      languages: [
                                        ...(prev.languages || []),
                                        value,
                                      ],
                                    }));
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 italic mt-2">
                        Press Enter or comma to add a language
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-8">
                <button
                  onClick={updateProfile}
                  disabled={isLoading || isUploading}
                  className="flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none"
                >
                  <FiSave className="w-6 h-6 mr-2" />
                  {isLoading || isUploading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
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
