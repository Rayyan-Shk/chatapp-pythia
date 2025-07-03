"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useChatStore } from "@/lib/store/chatStore";
import { useWebSocketStore } from "@/lib/store/websocketStore";
import { wsClient } from "@/lib/websocket/client";
import { registerWebSocketHandlers } from "@/lib/websocket/handlers";
import { ConnectionStatus } from "@repo/types";

interface UseWebSocketReturn {
  // Connection status
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  
  // Channel actions
  joinChannel: (channelId: string) => boolean;
  leaveChannel: (channelId: string) => boolean;
  
  // Messaging actions
  sendTypingIndicator: (channelId: string, isTyping: boolean) => boolean;
  getOnlineUsers: (channelId: string) => boolean;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

/**
 * Custom hook for WebSocket integration
 * Manages connection lifecycle and provides messaging capabilities
 */
export const useWebSocket = (): UseWebSocketReturn => {
  const { token, isAuthenticated, user } = useAuthStore();
  const { activeChannelId } = useChatStore();
  const { setConnectionStatus, incrementMessagesSent, incrementMessagesReceived } = useWebSocketStore();
  
  const connectionStatusRef = useRef<ConnectionStatus>("disconnected");
  const handlersCleanupRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !isInitializedRef.current) {
      isInitializedRef.current = true;
      initializeWebSocket();
    }

    return () => {
      if (isInitializedRef.current) {
        cleanup();
        isInitializedRef.current = false;
      }
    };
  }, [isAuthenticated, token]);

  // Auto-join active channel when it changes
  useEffect(() => {
    if (wsClient.isConnected() && activeChannelId) {
      wsClient.joinChannel(activeChannelId);
    }
  }, [activeChannelId]);

  // Handle authentication changes
  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnect();
      isInitializedRef.current = false;
    }
  }, [isAuthenticated, token]);

  const initializeWebSocket = useCallback(async () => {
    if (!token) {
      console.warn("Cannot initialize WebSocket: No token available");
      return;
    }

    try {
      // Register message handlers
      if (handlersCleanupRef.current) {
        handlersCleanupRef.current();
      }
      
      handlersCleanupRef.current = registerWebSocketHandlers(wsClient);

      // Set up status change listener
      const statusUnsubscribe = wsClient.onStatusChange((status) => {
        connectionStatusRef.current = status;
        setConnectionStatus(status);
      });

      // Connect to WebSocket
      await wsClient.connect(token);
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
    }
  }, [token]);

  const connect = useCallback(async () => {
    if (!token) {
      console.warn("Cannot connect: No authentication token");
      return;
    }

    try {
      await wsClient.connect(token);
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      throw error;
    }
  }, [token]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    cleanup();
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await connect();
  }, [connect, disconnect]);

  const cleanup = useCallback(() => {
    if (handlersCleanupRef.current) {
      handlersCleanupRef.current();
      handlersCleanupRef.current = null;
    }
  }, []);

  // Channel management functions
  const joinChannel = useCallback((channelId: string): boolean => {
    if (!wsClient.isConnected()) {
      console.warn("Cannot join channel: WebSocket not connected");
      return false;
    }

    return wsClient.joinChannel(channelId);
  }, []);

  const leaveChannel = useCallback((channelId: string): boolean => {
    if (!wsClient.isConnected()) {
      console.warn("Cannot leave channel: WebSocket not connected");
      return false;
    }

    return wsClient.leaveChannel(channelId);
  }, []);

  // Messaging functions
  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean): boolean => {
    if (!wsClient.isConnected()) {
      return false;
    }

    return wsClient.sendTypingIndicator(channelId, isTyping);
  }, []);

  const getOnlineUsers = useCallback((channelId: string): boolean => {
    if (!wsClient.isConnected()) {
      return false;
    }

    return wsClient.getOnlineUsers(channelId);
  }, []);

  return {
    // Connection status
    connectionStatus: connectionStatusRef.current,
    isConnected: wsClient.isConnected(),
    
    // Channel actions
    joinChannel,
    leaveChannel,
    
    // Messaging actions
    sendTypingIndicator,
    getOnlineUsers,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
  };
};

/**
 * Hook for accessing just the WebSocket connection status
 */
export const useWebSocketStatus = () => {
  const { connectionStatus } = useWebSocketStore();
  
  return {
    connectionStatus,
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    isDisconnected: connectionStatus === "disconnected",
    isReconnecting: connectionStatus === "reconnecting",
  };
};

/**
 * Hook for typing indicators in a specific channel
 */
export const useTypingIndicator = (channelId: string) => {
  const { sendTypingIndicator } = useWebSocket();
  
  return {
    sendTypingIndicator: (isTyping: boolean) => sendTypingIndicator(channelId, isTyping),
  };
}; 