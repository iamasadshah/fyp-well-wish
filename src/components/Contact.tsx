"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import emailjs from "@emailjs/browser";
import ReCAPTCHA from "react-google-recaptcha";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

const topics = [
  "General Inquiry",
  "Become a Caregiver",
  "Find a Caregiver",
  "Technical Support",
  "Billing Question",
  "Other",
];

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    topic: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaValue) {
      setSubmitStatus({
        type: "error",
        message: "Please complete the reCAPTCHA verification.",
      });
      return;
    }

    setIsLoading(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const templateParams = {
        from_name: `${formData.firstName} ${formData.lastName}`,
        from_email: formData.email,
        topic: formData.topic,
        message: formData.message,
      };

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_ID!
      );

      setSubmitStatus({
        type: "success",
        message: "Thank you for your message! We'll get back to you soon.",
      });
      setIsDialogOpen(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        topic: "",
        message: "",
      });
      // Reset reCAPTCHA
      recaptchaRef.current?.reset();
      setRecaptchaValue(null);
    } catch (error: unknown) {
      console.error("Email sending failed:", error);
      setSubmitStatus({
        type: "error",
        message:
          "Sorry, there was an error sending your message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen py-24 px-4" id="contact">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Content */}
          <div className="lg:w-1/3">
            <h1 className="text-5xl font-bold text-[#03045e] mb-6">
              Get in Touch
            </h1>
            <p className="text-[#03045e] text-lg mb-8">
              Want to get in touch? Contact us using the form on the side or
              click below to read FAQ section.
            </p>
            <Link
              href="#faq"
              className="inline-flex text-[#03045e] items-center text-buttons hover:text-shadoww transition-colors group"
            >
              <span className="border-b border-current">
                Jump to FAQ &uarr;{" "}
              </span>
            </Link>
          </div>

          {/* Right Content - Contact Form */}
          <div className="lg:w-2/3">
            {submitStatus.type === "error" && (
              <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
                {submitStatus.message}
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="bg-[#00b4d8] rounded-3xl p-8 space-y-6"
            >
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[#03045e]">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-lg">
                    First name<span className="text-buttons">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    placeholder="Name"
                    className="w-full bg-transparent border-b border-gray-600 px-0 py-2 placeholder-[#caf0f8] focus:border-buttons focus:outline-none transition-colors"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2 text-[#03045e]">
                  <label htmlFor="lastName" className="block text-lg">
                    Last name<span className="text-buttons">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    placeholder="Surname"
                    className="w-full bg-transparent border-b border-gray-600 px-0 py-2 placeholder-[#caf0f8] focus:border-buttons focus:outline-none transition-colors"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2 text-[#03045e]">
                <label htmlFor="email" className="block text-lg">
                  Email<span className="text-buttons">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email address here"
                  className="w-full bg-transparent border-b border-gray-600 px-0 py-2 placeholder-[#caf0f8] focus:border-buttons focus:outline-none transition-colors"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Topic Selection */}
              <div className="space-y-2 text-[#03045e]">
                <label htmlFor="topic" className="block text-lg">
                  What is your message about?
                </label>
                <div className="relative">
                  <select
                    id="topic"
                    className="w-full bg-transparent border-b px-4 py-2 focus:border-buttons focus:outline-none appearance-none cursor-pointer"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    disabled={isLoading}
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option
                        key={topic}
                        value={topic}
                        className="bg-[#0077b6]"
                      >
                        {topic}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="block text-lg text-[#03045e]"
                >
                  Your message<span className="text-buttons">*</span>
                </label>
                <textarea
                  id="message"
                  placeholder="Write your message here..."
                  rows={4}
                  className="w-full bg-transparent border-b border-gray-600 px-0 py-2 placeholder-[#caf0f8] focus:border-buttons focus:outline-none transition-colors resize-none"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_ID!}
                  onChange={(value: string | null) => setRecaptchaValue(value)}
                  theme="light"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group inline-flex items-center bg-[#caf0f8] px-8 py-3 rounded-full transition-colors ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-shadoww cursor-pointer"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#03045e]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="font-medium">Sending...</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">Submit</span>
                    <svg
                      className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Transition appear show={isDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDialogOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold leading-6 text-[#03045e] mb-4"
                  >
                    Message Sent Successfully!
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-gray-600">
                      Thank you for reaching out to us. We have received your
                      message and will get back to you as soon as possible.
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-full border border-transparent bg-[#00b4d8] px-6 py-2 text-base font-medium text-white hover:bg-[#03045e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] focus-visible:ring-offset-2 transition-colors"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
