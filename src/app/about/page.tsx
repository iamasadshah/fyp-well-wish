"use client";
import Image from "next/image";
import { FaHeart, FaHandshake, FaUsers, FaChartLine } from "react-icons/fa";

const teamMembers = [
  {
    name: "Asad Shah",
    role: "Frontend Engineer",
    image: "/assets/team/asadshah.jpg",
    bio: "Frontend engineer with a passion for creating intuitive user interfaces",
    linkedin: "https://www.linkedin.com/in/iamasadshah/",
  },
  {
    name: "Omer Farooq",
    role: "Backend Developer",
    image: "/assets/team/omerfrooq.jpg",
    bio: "Backend developer with a passion for creating efficient and scalable systems",
    linkedin: "https://www.linkedin.com/in/omer-farooq-b288b524b/",
  },
];

const values = [
  {
    icon: <FaHeart className="w-8 h-8" />,
    title: "Compassion",
    description:
      "We believe in treating everyone with kindness and understanding.",
  },
  {
    icon: <FaHandshake className="w-8 h-8" />,
    title: "Trust",
    description:
      "Building reliable relationships between caregivers and families.",
  },
  {
    icon: <FaUsers className="w-8 h-8" />,
    title: "Community",
    description:
      "Creating a supportive network for caregivers and care recipients.",
  },
  {
    icon: <FaChartLine className="w-8 h-8" />,
    title: "Innovation",
    description:
      "Continuously improving our platform to better serve our community.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="relative z-10 text-center text-[#03045e] px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About WellWish
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Transforming the way care is delivered and received through
            technology and compassion
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4 bg-white rounded-t-[60px]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-[#03045e]">Our Story</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                WellWish was born from a personal experience. After witnessing
                the challenges of finding quality care for a loved one, our
                founder realized there had to be a better way. We set out to
                create a platform that would make it easier for families to find
                compassionate, qualified caregivers while providing caregivers
                with meaningful opportunities to make a difference.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, WellWish has grown into a trusted platform connecting
                thousands of caregivers with families across the country, all
                while maintaining our commitment to quality, compassion, and
                innovation.
              </p>
            </div>
            <div className="relative aspect-square rounded-4xl overflow-hidden">
              <Image
                src="/assets/about-us.jpg"
                alt="Our Story"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-20 px-4 bg-gray-50 ">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#03045e] mb-6">
              Our Mission & Values
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              We&apos;re on a mission to revolutionize the care industry by
              connecting compassionate caregivers with those who need them most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-[#00b4d8] mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-[#03045e] mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#03045e] mb-6">Our Team</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Meet the passionate individuals behind WellWish who are dedicated
              to making a difference in the care industry.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-80">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-[#03045e] mb-2">
                    {member.name}
                  </h3>
                  <p className="text-[#00b4d8] font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#00b4d8] hover:text-[#03045e] transition-colors"
                  >
                    <span>Connect on LinkedIn</span>
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 px-4 bg-[#03045e] text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="text-5xl font-bold text-[#00b4d8]">10K+</div>
              <div className="text-xl">Caregivers Connected</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-[#00b4d8]">50K+</div>
              <div className="text-xl">Families Served</div>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-[#00b4d8]">98%</div>
              <div className="text-xl">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-50 rounded-b-[60px]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-[#03045e] mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Whether you&apos;re looking for care or want to provide care,
            we&apos;re here to help you make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#00b4d8] text-white rounded-full hover:bg-[#03045e] transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
