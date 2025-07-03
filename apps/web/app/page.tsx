"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { LandingPage } from "@/components/landing/LandingPage";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  console.log('🏠 HomePage: Auth state:', { isAuthenticated, loading });

  useEffect(() => {
    console.log('🏠 HomePage: useEffect triggered:', { isAuthenticated, loading });
    // Only redirect authenticated users to chat
    if (!loading && isAuthenticated) {
      console.log('🏠 HomePage: Redirecting authenticated user to /chat');
      router.replace("/chat");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    console.log('🏠 HomePage: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    console.log('🏠 HomePage: Showing landing page for unauthenticated user');
    return <LandingPage />;
  }

  // Show loading while redirecting authenticated users
  console.log('🏠 HomePage: Showing loading while redirecting authenticated user');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
