"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
} 