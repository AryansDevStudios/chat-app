# 💬 chat-app

> Sleek, real-time web chat room application with instant room sharing, rich media preview, voice notes, and Firebase Firestore synchronization.

![Next.js](https://img.shields.io/badge/Next.js-v15.5-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-v19.2-61DAFB?logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-v11%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Overview

**chat-app** is a modern, responsive real-time web chat application engineered with Next.js 15, React 19, and Firebase Firestore. Designed for instantaneous collaboration, users can spin up dedicated chat rooms or enter existing room IDs without friction, powered by Firebase Anonymous Authentication and URL-based routing.

The application delivers an Instagram/Discord-inspired dark aesthetic featuring live message synchronization, interactive image previews with full-screen zoom and pan gestures, integrated voice message playback, and quote replies.

---

## ✨ Features

- **Instant Room Creation & Joining**: Generate named or randomized chat rooms (`room_<slug>_<id>`) and share direct URL links for zero-setup group conversations.
- **Sub-Second Live Messaging**: Real-time snapshot listeners powered by Firebase Cloud Firestore for instant message delivery without WebSocket overhead.
- **Rich Media & Interactive Preview**: In-chat image rendering with a dedicated zoom-and-pan preview dialog supporting multi-touch gestures.
- **Integrated Voice Messages**: Send and listen to audio recordings with inline waveform playback controls and timing indicators.
- **Message Quoting & Threading**: Double-click or select "Reply" on any message to quote text and jump directly to referenced bubbles.
- **Edit & Delete Controls**: Full message lifecycle management allowing senders to update contents or revoke messages in real time.
- **Frictionless Anonymous Auth**: Seamless background guest authentication via Firebase Auth with local persistence of display names and recently visited rooms.
- **Tailored Firestore Security**: Includes production security rules (`firestore.rules`) enforcing room membership constraints and data validation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Turbopack dev server)
- **Frontend Library**: [React 19.2](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons, `clsx`, `tailwind-merge`
- **Database & Auth**: [Firebase v11](https://firebase.google.com/) (Firestore Realtime listeners, Anonymous Authentication)
- **Form Management**: React Hook Form, Zod

---

## 📁 Project Structure

```
chat-app/
├── firestore.rules           # Firebase Firestore security rules
├── next.config.ts            # Next.js build & Turbopack configuration
├── package.json              # Project dependencies & npm scripts
├── tailwind.config.ts        # Tailwind design system configuration
├── tsconfig.json             # TypeScript compiler settings
└── src/
    ├── app/
    │   ├── layout.tsx        # Root layout with theme & font providers
    │   └── page.tsx          # Dynamic room router & dashboard host
    ├── components/
    │   ├── chat/
    │   │   └── ChatRoom.tsx  # Core chat room interface, bubble feeds & modal previews
    │   ├── home/
    │   │   └── HomeDashboard.tsx # Room creation, entry portal & recent rooms list
    │   └── ui/               # Radix UI primitive components (dialog, dropdown, toast)
    ├── firebase/             # Client SDK initialization and custom auth hooks
    └── hooks/
        ├── use-chat-session.ts # Session state, localStorage sync & navigation helpers
        └── use-toast.ts      # Toast notification dispatch hook
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `18.x` or later
- npm or pnpm
- A Firebase project with **Firestore Database** and **Anonymous Authentication** enabled

### 1. Clone Repository

```bash
git clone https://github.com/AryansDevStudios/chat-app.git
cd chat-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

### 5. Production Build

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
