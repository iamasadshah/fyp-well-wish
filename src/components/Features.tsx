import React from "react";

// List of features to display on the features section
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

// Features component displays a grid of feature cards
export default function Features() {
  return (
    <section className="bg-[#caf0f8] py-24 px-4 ">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-6xl font-bold text-text mb-16">Features</h1>

        {/* Feature cards grid */}
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
      </div>
    </section>
  );
}
