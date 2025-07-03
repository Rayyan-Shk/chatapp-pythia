// Export all types
export * from './api';
export * from './auth';
export * from './chat';
export * from './websocket';

// Re-export commonly used types for convenience
export type { User, AuthResponse, UserCreate, UserLogin } from './auth';
export type { 
  Channel, 
  ChannelWithMembers, 
  MessageWithDetails, 
  MessageCreate,
  TypingIndicator 
} from './chat';
export type { 
  ConnectionStatus, 
  WebSocketMessage, 
  ServerMessage, 
  ClientMessage 
} from './websocket';

// User types
export * from './user';

// Message types
export * from './message';

// Channel types
export * from './channel';

// Socket event types
export interface SocketEvents {
  // Client to Server
  'send_message': (data: { content: string; channelId: string }) => void;
  'join_channel': (data: { channelId: string }) => void;
  'leave_channel': (data: { channelId: string }) => void;
  'typing_start': (data: { channelId: string }) => void;
  'typing_stop': (data: { channelId: string }) => void;
  
  // Server to Client
  'new_message': (message: Message) => void;
  'user_joined': (data: { userId: string; channelId: string }) => void;
  'user_left': (data: { userId: string; channelId: string }) => void;
  'typing_indicator': (data: TypingIndicator) => void;
  'user_presence': (data: UserPresence) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export type { User, UserCreate, UserLogin, AuthResponse } from './auth';

// API types
export type { ApiResponse, PaginatedResponse } from './api';

// Chat types
export type { 
  Channel, 
  ChannelWithMembers, 
  MessageWithDetails, 
  MessageCreate,
  TypingIndicator 
} from './chat';

// Message types
export type { Message, MessageFormatting, MessageReaction } from './message';

// WebSocket types
export type { 
  ConnectionStatus, 
  WebSocketMessage, 
  JoinChannelMessage, 
  TypingIndicatorMessage 
} from './websocket';

// Phase 5: Advanced Features
export type { 
  SearchResult, 
  SearchFilters, 
  SearchResponse, 
  SearchSuggestion 
} from './search';

export type { 
  NotificationType, 
  NotificationData, 
  NotificationSettings, 
  NotificationPreferences 
} from './notification';

export type { 
  FileUpload, 
  FileMetadata, 
  FileUploadProgress, 
  FileUploadResponse, 
  FileType, 
  FileTypeConfig 
} from './file'; 