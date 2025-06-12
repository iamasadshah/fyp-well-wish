import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <section className=" min-h-screen py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Image Section */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              {/* Custom shaped image container */}
              <div className="relative aspect-[4/3] w-full">
                <div
                  className="absolute inset-0 rounded-[3rem] overflow-hidden"
                  style={{
                    clipPath: "polygon(0% 0%, 100% 0%, 85% 100%, 0% 85%)",
                  }}
                >
                  <Image
                    src="/assets/about.jpg"
                    alt="About WellWish"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-light/20 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          </div>

          {/* Right Content Section */}
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-5xl font-bold text-text">About</h2>
            <p className="text-lg text-text leading-relaxed">
              At WellWish, we believe in transforming the way care is delivered
              and received. Our platform connects compassionate caregivers with
              those who need them, creating meaningful relationships that go
              beyond traditional care services. We&apos;re committed to making
              quality care accessible, personal, and seamless for everyone
              involved.
            </p>
            <Link href="/about" className="inline-flex items-center group">
              <span className="bg-[#00b4d8] text-text px-6 py-3 rounded-l-full font-medium">
                Read more
              </span>
              <span className="bg-[#90e0ef] p-3 rounded-r-full group-hover:bg-primary-light transition-colors">
                <svg
                  className="w-6 h-6 text-primary-dark group-hover:translate-x-1 transition-transform"
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
        </div>
      </div>
    </section>
  );
}
