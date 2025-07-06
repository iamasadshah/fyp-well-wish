import Image from "next/image";

import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

// List of social media links with icons
const socialLinks = [
  { icon: FaFacebook, href: "https://facebook.com/wellwish" },
  { icon: FaTwitter, href: "https://twitter.com/wellwish" },
  { icon: FaInstagram, href: "https://instagram.com/wellwish" },
  { icon: FaLinkedin, href: "https://linkedin.com/company/wellwish" },
];

// Footer component displays company info, social links, and copyright
export default function Footer() {
  return (
    <footer className=" text-white text-center px-8 py-10">
      {/* Company Info: Logo, name, and tagline */}
      <div className="flex flex-col justify-center items-center">
        <Image
          src="/assets/logo.png"
          alt="logo"
          width={1000}
          height={1000}
          className="w-12 h-6"
        />
        <h3 className="text-2xl font-semibold mb-2 text-[#03045e]">WellWish</h3>
        <p className="text-[#3436bc]">
          Connecting hearts, delivering care. Making caregiving simple, safe,
          and meaningful.
        </p>
      </div>

      {/* Social Media Links */}
      <div className="border-t border-gray-800 mt-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-4 md:mb-0">
            {socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#03045e] hover:text-blue-700 transition-colors"
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
          {/* Copyright */}
          <p className="text-[#03045e]">
            © {new Date().getFullYear()} WellWish. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
