"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, loading, user, token } = useAuth();

  console.log("🛡️ AuthGuard: Checking auth status", { 
    isAuthenticated, 
    loading, 
    hasUser: !!user, 
    hasToken: !!token 
  });

  if (loading) {
    console.log("🛡️ AuthGuard: Showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Loading Pythia</CardTitle>
              <CardDescription>
                Initializing your workspace...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🛡️ AuthGuard: User not authenticated, returning null (middleware should handle redirect)");
    return null; // Let middleware handle redirects
  }

  console.log("🛡️ AuthGuard: User authenticated, rendering children");
  return <>{children}</>;
}; 