import React from "react";

const features = [
  {
    tag: "#one",
    title: "Reliability",
    description:
      "Lorem ipsum praesent ac massa at ligula reet est iaculis. Vivamus est mist aliquet elit ac nisl.",
  },
  {
    tag: "#two",
    title: "Transparency",
    description:
      "Lorem ipsum praesent ac massa at ligula reet est iaculis. Vivamus est mist aliquet elit ac nisl.",
  },
  {
    tag: "#three",
    title: "Simplicity",
    description:
      "Lorem ipsum praesent ac massa at ligula reet est iaculis. Vivamus est mist aliquet elit ac nisl.",
  },
  {
    tag: "#four",
    title: "Simplicity",
    description:
      "Lorem ipsum praesent ac massa at ligula reet est iaculis. Vivamus est mist aliquet elit ac nisl.",
  },
];

export default function Features() {
  return (
    <section className="bg-[#caf0f8] py-24 px-4 ">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-6xl font-bold text-text mb-16">Features</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              {/* Feature tag */}
              <div className="absolute -top-4 left-6 z-10">
                <span className="bg-[#90e0ef] bg-opacity-90 text-[#1E1B3A] px-4 py-2 rounded-full text-sm font-medium">
                  {feature.tag}
                </span>
              </div>

              {/* Feature card */}
              <div className="bg-[#00b4d8] rounded-[2rem] p-8 pt-12 h-full transition-transform duration-300 group-hover:-translate-y-2">
                <h3 className="text-3xl font-bold text-black mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-800 text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign up button */}
        <div className="mt-8 flex justify-center items-center">
          <button className="group inline-flex items-center bg-[#00b4d8] rounded-full text-[#1E1B3A] overflow-hidden px-1">
            <span className="px-6 py-3 text-lg font-semibold">Sign up</span>
            <span className="w-16 h-12 rounded-full flex items-center justify-center bg-[#90e0ef] text-texte transition-transform group-hover:translate-x-1">
              <svg
                className="w-6 h-6"
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
          </button>
        </div>
      </div>
    </section>
  );
}
