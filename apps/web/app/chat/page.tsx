"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/lib/store/chatStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { wsClient } from "@/lib/websocket/client";
import { MessageArea } from "@/components/chat/MessageArea";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function ChatPage() {
  const { activeChannelId, channels, initializeFromPersistence, setActiveChannelId } = useChatStore();
  const { user, isAuthenticated, hasSeenWelcome, setHasSeenWelcome } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize WebSocket connection
  const { connectionStatus, isConnected } = useWebSocket();

  // Handle client-side mounting and persistence
  useEffect(() => {
    setMounted(true);
    // Initialize from persistence on mount
    initializeFromPersistence();
    setInitialized(true);
  }, []);

  // Auto-join active channel when WebSocket is connected
  useEffect(() => {
    if (isConnected && activeChannelId) {
      wsClient.joinChannel(activeChannelId);
    }
  }, [isConnected, activeChannelId]);

  // Show loading until mounted and initialized (prevents hydration mismatch)
  if (!mounted || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Determine if we should show the welcome screen
  // Only show welcome if no active channel AND user hasn't seen welcome
  const shouldShowWelcome = !activeChannelId && !hasSeenWelcome;

  return (
    <MobileLayout>
      {shouldShowWelcome ? (
        <div className="flex-1 flex flex-col">
          <WelcomeScreen onWelcomeComplete={() => setHasSeenWelcome(true)} />
        </div>
      ) : activeChannelId ? (
        <MessageArea channelId={activeChannelId} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading channel...</p>
          </div>
        </div>
      )}
    </MobileLayout>
  );
} 