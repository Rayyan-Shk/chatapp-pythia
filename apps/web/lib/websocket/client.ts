"use client";

import { ConnectionStatus } from "@repo/types";

export type WebSocketEventHandler = (data: any) => void;

interface WebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectDelay: number;
  private readonly heartbeatInterval: number;
  private readonly timeout: number;
  
  private messageHandlers = new Map<string, Set<WebSocketEventHandler>>();
  private statusCallbacks = new Set<(status: ConnectionStatus) => void>();
  
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionStatus: ConnectionStatus = "disconnected";

  constructor(config: WebSocketConfig = {}) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000; // 30 seconds
    this.timeout = config.timeout ?? 10000; // 10 seconds
  }

  /**
   * Connect to WebSocket server with JWT token
   */
  async connect(token: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("🔗 WebSocket already connected");
      return;
    }

    this.token = token;
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws?token=${token}`;
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        this.setupWebSocketHandlers(resolve, reject);
      } catch (error) {
        console.error("❌ WebSocket connection failed:", error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      // Remove event listeners to prevent reconnection
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, "Client disconnecting");
      }
      this.ws = null;
    }
    
    this.token = null;
    this.reconnectAttempts = 0;
    this.updateConnectionStatus("disconnected");
  }

  /**
   * Send message to server
   */
  send(type: string, data?: Record<string, any>): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn(`Cannot send message: WebSocket not connected (state: ${this.ws?.readyState})`);
      return false;
    }

    try {
      const message = JSON.stringify({ type, ...data });
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
      return false;
    }
  }

  /**
   * Subscribe to message type
   */
  on(messageType: string, handler: WebSocketEventHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    
    this.messageHandlers.get(messageType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType);
        }
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Channel-specific methods
  joinChannel(channelId: string): boolean {
    return this.send("join_channel", { channel_id: channelId });
  }

  leaveChannel(channelId: string): boolean {
    return this.send("leave_channel", { channel_id: channelId });
  }

  sendTypingIndicator(channelId: string, isTyping: boolean): boolean {
    return this.send("typing_indicator", {
      channel_id: channelId,
      is_typing: isTyping,
    });
  }

  getOnlineUsers(channelId: string): boolean {
    return this.send("get_online_users", { channel_id: channelId });
  }

  ping(): boolean {
    return this.send("ping");
  }

  // Private methods
  private setupWebSocketHandlers(
    resolve?: () => void,
    reject?: (error: any) => void
  ) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected successfully");
      this.reconnectAttempts = 0;
      this.updateConnectionStatus("connected");
      resolve?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📥 WebSocket message received:", message);
        this.handleMessage(message);
      } catch (error) {
        console.error("❌ Failed to parse WebSocket message:", error, event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`🔌 WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`);
      this.updateConnectionStatus("disconnected");
      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      this.updateConnectionStatus("error");
      reject?.(error);
    };
  }

  private handleMessage(message: any): void {
    const { type } = message;
    
    if (!type) {
      console.warn("Received message without type:", message);
      return;
    }

    // Handle heartbeat response
    if (type === "pong") {
      return; // Heartbeat handled, no need to propagate
    }

    // Propagate to registered handlers
    const handlers = this.messageHandlers.get(type);
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in message handler for type '${type}':`, error);
        }
      });
    }
  }

  private handleConnectionError(error: unknown): void {
    console.error("WebSocket connection error:", error);
    this.updateConnectionStatus("error");
    this.handleReconnect();
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.token) {
      console.error("Max reconnection attempts reached or no token available");
      this.updateConnectionStatus("disconnected");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      } else {
        this.clearHeartbeat();
      }
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus === status) return;
    
    this.connectionStatus = status;
    console.log(`WebSocket status changed: ${status}`);
    
    // Notify all status callbacks
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error("Error in status change callback:", error);
      }
    });
  }
}

// Singleton instance
export const wsClient = new WebSocketClient({
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 15000, // Reduced from 30s to 15s to match backend expectations
  timeout: 10000,
});

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    wsClient.disconnect();
  });
} 