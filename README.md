# 📖 **WellWish** — _Your Wish for Care, Our Mission to Deliver._ 🤝✨

Welcome to **WellWish**, the platform that bridges **Care Seekers** and **Care Givers** — safely, easily, and warmly.  
Whether you need elderly support, babysitting, health assistance, or simple companionship, WellWish is here to deliver trusted care at your fingertips.

Built as a Final Year Project, designed to scale into a real-world solution. 🚀

---

## ⚡ Tech Stack

| Layer            | Technology                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Frontend         | [Next.js](https://nextjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [TailwindCSS](https://tailwindcss.com/) |
| Backend & Auth   | [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Authentication)                                                 |
| Hosting          | [Vercel](https://vercel.com/)                                                                                            |
| Notifications    | [Supabase](https://supabase.com/)(in app notifications)                                                                  |
| Payments         | [Stripe](https://stripe.com/)                                                                                            |
| Version Control  | [GitHub](https://github.com/)                                                                                            |
| PWA Support      | Installable like a native app 📱                                                                                         |

---

## 🚀 Getting Started

Follow these simple steps to set up WellWish locally:

### 1. Clone the Repository

```bash
git clone https://github.com/iamasadshah/WellWish.git
cd WQellWish
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID= emailjs service id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID= emailjs template id
NEXT_PUBLIC_EMAILJS_PUBLIC_ID= emailjs public id
NEXT_PUBLIC_RECAPTCHA_SITE_ID = ReCaptcha site id
NEXT_PUBLIC_SUPABASE_URL= your supabase url
NEXT_PUBLIC_SUPABASE_ANON_KEY= your supabase anon key
NEXT_PUBLIC_ADMIN_EMAIL = Your Email
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = Your strip publishable key
STRIPE_SECRET_KEY = your stripe secret key

```

> 🛠️ **Tip:** Get these keys from your Supabase, Stripe, ReCAPTCHA, and Emailjs.

### 4. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open your browser and visit [http://localhost:3000](http://localhost:3000) to see WellWish in action!

---

## 🏗️ Project Structure

```bash
/wellwish
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── shared/           # Shared components
├── lib/                  # Utility functions and configurations
│   ├── supabase/        # Supabase client and helpers
│   ├── stripe/          # Stripe integration
│   └── utils/           # Helper functions
├── hooks/               # Custom React hooks
├── styles/             # Global styles and TailwindCSS
├── public/             # Static assets
│   ├── images/        # Image assets
│   └── icons/         # Icon assets
├── types/             # TypeScript type definitions
├── .env.local         # Environment variables
├── tailwind.config.ts # TailwindCSS configuration
├── next.config.js     # Next.js configuration
└── package.json       # Project dependencies
```

---

## ✨ Core Features

- 🔐 **Authentication** — Secure signup/login with Email & Google (via Supabase)
- 🎯 **Care Seeker Posting** — Post caregiving requirements easily
- 🧑‍⚕️ **Caregiver Browsing** — Explore trusted caregiver profiles
- 💬 **Real-Time Chat** — Instant communication post-booking
- 📅 **Booking Management** — Accept, reschedule, or cancel bookings
- 🔔 **Push Notifications** — Real-time updates via OneSignal
- 💳 **Payment Gateway** — Secure transactions through Stripe
- ⭐ **Reviews & Ratings** — Build trust through authentic feedback
- 🛡️ **Admin Dashboard** — Manage users and oversee reports via Appwrite
- ⚙️ **Error Monitoring** — Track and fix bugs using Sentry
- 📱 **PWA (Progressive Web App)** — Installable on mobile and desktop

---

## 🔮 Future Roadmap

- 🤖 **AI Matching Algorithm** — Smart caregiver suggestions based on needs
- ✅ **Background Verification** — Caregiver trust checks
- 📹 **Video Call Support** — Virtual caregiver interviews
- 🏆 **Membership Plans** — Unlock premium features for seekers and givers
- 🌍 **Multilingual Support** — Take WellWish global

---

## 🚀 Deployment

WellWish is designed for seamless deployment.

> **How it works:**  
> Push your code to the `main` branch → Vercel auto-builds and deploys your app in seconds.

---

## 🤝 Contribution Guide

We welcome contributions from the community!

1. Fork the repository
2. Create a new branch:  
   `git checkout -b feature/your-feature-name`
3. Commit your changes:  
   `git commit -m "Add: feature name"`
4. Push to your branch:  
   `git push origin feature/your-feature-name`
5. Open a Pull Request 🚀

---

## 📜 License

Licensed under the [MIT License](LICENSE).

Feel free to use, modify, and distribute WellWish with attribution.

---

## 👤 Author

Crafted with ❤️ by **Asad Shah**

- [GitHub](https://github.com/iamasadshah)
- [LinkedIn](https://linkedin.com/in/iamasadshah)

---

## 🌟 Final Words

> "At WellWish, we don't just connect users — we connect hearts.  
> Because sometimes, a little care is all it takes to change a life." ❤️

---
