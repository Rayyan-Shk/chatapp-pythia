# Pythia Conversations - Documentation

The documentation site for Pythia Conversations, built with Next.js and featuring comprehensive guides and API documentation.

## 🚀 Overview

This is the documentation application for Pythia Conversations, providing detailed information about the project, API documentation, setup guides, and development resources.

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library

## 📚 Documentation Sections

- **Getting Started** - Quick setup and installation guides
- **API Reference** - Complete API documentation
- **Features** - Detailed feature explanations
- **Architecture** - System design and architecture overview
- **Development** - Development guidelines and best practices

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
npm run dev --filter=docs
```

Open [http://localhost:3000](http://localhost:3000) to view the documentation.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
apps/docs/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/                # Static assets
└── components/            # Documentation components
```

## 📋 About This Project

This is a skill test and assignment project demonstrating full-stack development capabilities with comprehensive documentation.
