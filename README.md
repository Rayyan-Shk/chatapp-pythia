# Pythia Conversations

A modern, real-time team chat application built for marketing teams with WhatsApp-like features and seamless collaboration.

## 📱 Screenshots

<div align="center">
  <img src="apps/web/public/project/home (2).png" alt="Home Dashboard" />
  <img src="apps/web/public/project/Login (2).png" alt="Login Screen" />
  <img src="apps/web/public/project/Register.png" alt="Registration Screen" />
  <img src="apps/web/public/project/Chat View.png" alt="Chat Interface" />
  <img src="apps/web/public/project/Create Channel.png" alt="Create Channel" />
  <img src="apps/web/public/project/Mobile view.png" alt="Mobile View" />
</div>

## 🚀 Overview

Pythia Conversations is a full-stack chat application designed for marketing teams to collaborate effectively. Built with modern web technologies, it provides a seamless real-time messaging experience with advanced features like channel management, message reactions, and mobile responsiveness.

## ✨ Key Features

- **📱 Mobile Compatible** - Fully responsive design that works perfectly on all devices
- **⚡ Real-time Typing Indicators** - WhatsApp-like typing indicators showing when users are typing
- **🏢 Channel Management** - Create and manage team channels for organized conversations
- **👥 Member Management** - Add and remove members from channels with role-based permissions
- **💬 Message Replies** - Reply to specific messages with a beautiful threaded view like WhatsApp
- **😊 Message Reactions** - React to messages with emojis for quick feedback
- **🔍 Global Search** - Search across messages, channels, and users
- **🔔 Real-time Notifications** - Instant notifications for new messages and mentions
- **🎨 Modern UI** - Beautiful interface built with TailwindCSS and shadcn/ui components

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Zustand** - State management
- **WebSocket** - Real-time communication

### Backend

- **FastAPI** - High-performance Python web framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **Redis** - Caching and real-time features
- **WebSocket** - Real-time messaging
- **JWT** - Authentication

### Infrastructure

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Turborepo** - Monorepo management

### CI/CD Pipeline

- **GitHub Actions** - Automated testing and deployment
- **ESLint** - Code linting and quality checks
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Docker** - Containerized builds and testing

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for development)

### Running the Application

1. **Clone the repository**

   ```bash
   git clone https://github.com/Rayyan-Shk/chatapp-pythia.git
   cd chatapp-pythia
   ```

2. **Start the application**

   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development

For development without Docker, you'll need to set up both frontend and backend separately:

#### Backend Setup

1. **Install Python dependencies**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up database and Redis**
   - Install PostgreSQL and Redis locally
   - Create database: `pythia_chat`
   - Update connection strings in `backend/app/core/config.py` if needed

3. **Generate Prisma client and setup database**

   ```bash
   cd backend
   prisma generate
   prisma db push
   python scripts/setup_default_channels.py
   ```

4. **Start the backend server**
   ```bash
   python start.py
   ```
   Backend will be available at: http://localhost:8000

#### Frontend Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the frontend**
   ```bash
   npm run dev --filter=web
   ```
   Frontend will be available at: http://localhost:3000

#### Environment Variables

Create `.env` files in both `backend/` and `apps/web/` directories:

**Backend (.env)**

```
DATABASE_URL=postgresql://user:password@localhost:5432/pythia_chat
REDIS_URL=redis://localhost:6330
JWT_SECRET_KEY=your-super-secret-jwt-key
```

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 📁 Project Structure

```
chatapp-pythia/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── docs/                # Documentation site
├── backend/                 # FastAPI backend
├── packages/                # Shared packages
│   ├── ui/                  # Shared UI components
│   ├── types/               # TypeScript type definitions
│   └── schemas/             # Zod validation schemas
└── docker-compose.yml       # Docker orchestration
```

## 🔧 Configuration

The application uses environment variables for configuration. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint

## 🔄 CI/CD Pipeline

The project includes automated CI/CD pipeline with the following checks:

### Code Quality Checks

- **TypeScript Compilation** - Ensures type safety across the codebase
- **ESLint** - Code linting and style enforcement
- **Prettier** - Automatic code formatting
- **Unit Tests** - Automated testing for critical components

### Build & Deploy

- **Docker Build** - Containerized builds for consistency
- **Dependency Checks** - Security vulnerability scanning
- **Build Verification** - Ensures all packages build successfully

### Pipeline Stages

1. **Code Checkout** - Clone repository and setup environment
2. **Install Dependencies** - Install all required packages
3. **Lint & Format** - Run ESLint and Prettier checks
4. **Type Check** - Verify TypeScript compilation
5. **Build** - Build all applications and packages
6. **Test** - Run automated tests
7. **Deploy** - Deploy to staging/production (if configured)

## 📋 About This Project

This is a skill test and assignment project built to demonstrate full-stack development capabilities. It showcases modern web development practices, real-time communication, and comprehensive feature implementation for a team chat application.

## 🤝 Contributing

This is an assignment project, but contributions and feedback are welcome for learning purposes.
