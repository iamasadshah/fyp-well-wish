"use client";
import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "Do I need Experience?",
    answer:
      "While experience is valuable, it's not always mandatory. We welcome caregivers with various levels of experience. What's most important is your commitment to providing quality care, reliability, and compassion for others.",
  },
  {
    question: "How Can I find Caregiver?",
    answer:
      "Finding a caregiver is simple! Create an account, specify your care needs, and browse through our verified caregivers. You can filter by location, experience, specialties, and availability to find the perfect match for your needs.",
  },
  {
    question: "How to Find CareSeeker?",
    answer:
      "As a caregiver, you can easily find care seekers by creating your profile and browsing through care requests in your area. Set your availability, specialties, and preferences to match with compatible care seekers.",
  },
  {
    question: "How Much I Can Earn?",
    answer:
      "Earnings vary based on factors like experience, location, and type of care provided. On average, caregivers on our platform earn competitive rates, with opportunities for bonuses and increased rates as you gain more experience and positive reviews.",
  },
];

export default function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <section
      className=" px-4 min-h-screen relative -mt-80 md:-my-96 lg:my-0"
      id="faq"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left Content */}
          <div className="lg:w-1/3">
            <h1 className="text-5xl font-bold text-[#00b4d8] mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-[#00b4d8] text-lg mb-8">
              Got more questions? Feel free to contact us for more information.
            </p>
            <Link href="#contact" className="inline-flex items-center group">
              <span className="bg-[#00b4d8] text-black px-6 py-3 rounded-l-full font-medium">
                Contact us
              </span>
              <span className="bg-[#90e0ef] p-3 rounded-r-full">
                <svg
                  className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </Link>
          </div>

          {/* Right Content - FAQ Accordion */}
          <div className="lg:w-2/3 space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full text-left bg-[#90e0ef] hover:bg-[#00b4d8] transition-colors rounded-2xl px-8 py-6 flex items-center justify-between group"
                >
                  <h3 className="text-2xl font-semibold text-[#03045e]">
                    {faq.question}
                  </h3>
                  <span className="flex-shrink-0 ml-4">
                    <svg
                      className={`w-6 h-6 text-[#03045e] transition-transform duration-300 ${
                        openQuestion === index ? "rotate-45" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
                </button>
                {openQuestion === index && (
                  <div className="mt-2 px-8 py-6 text-[#03045e] text-lg leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
