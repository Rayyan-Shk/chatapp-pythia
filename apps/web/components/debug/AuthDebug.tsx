"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, User, Key, AlertCircle } from "lucide-react";

export const AuthDebug = () => {
  const { user, token, loading, isAuthenticated, logout } = useAuth();
  const { hasSeenWelcome, resetWelcome } = useAuthStore();

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const cookieToken = getCookie('pythia-auth-token');
  const localStorageToken = typeof window !== "undefined" ? localStorage.getItem('pythia-auth-token') : null;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentication Debug
        </CardTitle>
        <CardDescription>
          Current authentication state and tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Loading:</span>
            <Badge variant={loading ? "destructive" : "secondary"}>
              {loading ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">User Info:</span>
            </div>
            <div className="text-sm space-y-1">
              <div><strong>Username:</strong> {user.username}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>ID:</strong> {user.id}</div>
            </div>
          </div>
        )}

        {/* Token Info */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="text-sm font-medium">Token Status:</span>
          </div>
          <div className="text-sm space-y-1">
            <div><strong>Store Token:</strong> {token ? "✅ Present" : "❌ Missing"}</div>
            <div><strong>LocalStorage:</strong> {localStorageToken ? "✅ Present" : "❌ Missing"}</div>
            <div><strong>Cookie:</strong> {cookieToken ? "✅ Present" : "❌ Missing"}</div>
          </div>
        </div>

        {/* Welcome Screen Status */}
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Welcome Screen:</span>
          </div>
          <div className="text-sm">
            <div><strong>Has Seen Welcome:</strong> {hasSeenWelcome ? "✅ Yes" : "❌ No"}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isAuthenticated && (
            <Button onClick={logout} variant="outline" size="sm" className="flex-1">
              Logout
            </Button>
          )}
          <Button onClick={resetWelcome} variant="outline" size="sm" className="flex-1">
            Reset Welcome
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 