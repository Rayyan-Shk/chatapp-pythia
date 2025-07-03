# Pythia Conversations - Frontend

The Next.js frontend application for Pythia Conversations, a modern team chat application with real-time features.

## 🚀 Overview

This is the main frontend application built with Next.js 14, featuring a modern chat interface with WhatsApp-like functionality including real-time messaging, typing indicators, message reactions, and mobile responsiveness.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Zustand** - State management
- **WebSocket** - Real-time communication

## ✨ Features

- **📱 Mobile Compatible** - Fully responsive design
- **⚡ Real-time Typing Indicators** - WhatsApp-like typing indicators
- **🏢 Channel Management** - Create and manage team channels
- **👥 Member Management** - Add and remove channel members
- **💬 Message Replies** - Threaded message replies
- **😊 Message Reactions** - Emoji reactions to messages
- **🔍 Global Search** - Search across messages and users
- **🔔 Real-time Notifications** - Instant notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for full stack)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or using turbo
npm run dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── chat/              # Chat interface
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── chat/              # Chat components
│   ├── ui/                # UI components
│   └── providers/         # Context providers
├── lib/                   # Utilities and configurations
│   ├── api/               # API client
│   ├── store/             # Zustand stores
│   └── websocket/         # WebSocket client
└── hooks/                 # Custom React hooks
```

## 🔧 Configuration

Key environment variables:

- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_WS_URL` - WebSocket endpoint

## 📋 About This Project

This is a skill test and assignment project demonstrating full-stack development capabilities with modern web technologies and real-time features.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
