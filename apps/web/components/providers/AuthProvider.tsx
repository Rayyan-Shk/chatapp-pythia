"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { initializeAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.warn("Failed to initialize auth:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Pythia Conversations</CardTitle>
              <CardDescription>
                Starting up...
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">
              Initializing application
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}; 