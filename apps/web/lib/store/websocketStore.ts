import { create } from 'zustand';
import { ConnectionStatus } from '@repo/types';

interface WebSocketState {
  // Connection status
  connectionStatus: ConnectionStatus;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  reconnectAttempts: number;
  
  // Error tracking
  lastError: string | null;
  errorCount: number;
  
  // Performance metrics
  messagesSent: number;
  messagesReceived: number;
  
  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastConnected: (date: Date) => void;
  setLastDisconnected: (date: Date) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setLastError: (error: string | null) => void;
  incrementErrorCount: () => void;
  resetErrorCount: () => void;
  incrementMessagesSent: () => void;
  incrementMessagesReceived: () => void;
  reset: () => void;
  
  // Computed getters
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  connectionUptime: () => number | null;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // Initial state
  connectionStatus: 'disconnected',
  lastConnected: null,
  lastDisconnected: null,
  reconnectAttempts: 0,
  lastError: null,
  errorCount: 0,
  messagesSent: 0,
  messagesReceived: 0,
  
  // Computed properties
  get isConnected() {
    return get().connectionStatus === 'connected';
  },
  
  get isConnecting() {
    return get().connectionStatus === 'connecting';
  },
  
  get hasError() {
    return get().connectionStatus === 'error' || get().lastError !== null;
  },
  
  // Actions
  setConnectionStatus: (status) => set((state) => {
    const now = new Date();
    const updates: Partial<WebSocketState> = { connectionStatus: status };
    
    // Track connection timestamps
    if (status === 'connected') {
      updates.lastConnected = now;
      updates.lastError = null; // Clear error on successful connection
    } else if (status === 'disconnected') {
      updates.lastDisconnected = now;
    }
    
    return { ...state, ...updates };
  }),
  
  setLastConnected: (date) => set({ lastConnected: date }),
  
  setLastDisconnected: (date) => set({ lastDisconnected: date }),
  
  incrementReconnectAttempts: () => set((state) => ({
    reconnectAttempts: state.reconnectAttempts + 1
  })),
  
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  
  setLastError: (error) => set((state) => ({
    lastError: error,
    errorCount: error ? state.errorCount + 1 : state.errorCount
  })),
  
  incrementErrorCount: () => set((state) => ({
    errorCount: state.errorCount + 1
  })),
  
  resetErrorCount: () => set({ errorCount: 0 }),
  
  incrementMessagesSent: () => set((state) => ({
    messagesSent: state.messagesSent + 1
  })),
  
  incrementMessagesReceived: () => set((state) => ({
    messagesReceived: state.messagesReceived + 1
  })),
  
  connectionUptime: () => {
    const state = get();
    if (!state.lastConnected || state.connectionStatus !== 'connected') {
      return null;
    }
    return Date.now() - state.lastConnected.getTime();
  },
  
  reset: () => set({
    connectionStatus: 'disconnected',
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
    lastError: null,
    errorCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
  }),
}));

/**
 * Hook to get WebSocket connection statistics
 */
export const useWebSocketStats = () => {
  const {
    connectionStatus,
    lastConnected,
    lastDisconnected,
    reconnectAttempts,
    errorCount,
    messagesSent,
    messagesReceived,
    connectionUptime,
    isConnected,
    isConnecting,
    hasError,
  } = useWebSocketStore();

  return {
    status: {
      connectionStatus,
      isConnected,
      isConnecting,
      hasError,
    },
    timestamps: {
      lastConnected,
      lastDisconnected,
      uptime: connectionUptime(),
    },
    metrics: {
      reconnectAttempts,
      errorCount,
      messagesSent,
      messagesReceived,
    },
  };
}; 