import { MessageWithDetails, TypingIndicator } from './chat';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: string;
  timestamp: string;
  data?: any;
}

// Client to Server messages
export interface JoinChannelMessage {
  type: 'join_channel';
  channel_id: string;
}

export interface LeaveChannelMessage {
  type: 'leave_channel';
  channel_id: string;
}

export interface TypingIndicatorMessage {
  type: 'typing_indicator';
  channel_id: string;
  is_typing: boolean;
}

export interface PingMessage {
  type: 'ping';
}

export interface GetOnlineUsersMessage {
  type: 'get_online_users';
  channel_id: string;
}

// Server to Client messages
export interface ConnectionEstablishedMessage {
  type: 'connection_established';
  user_id: string;
  username: string;
  timestamp: string;
}

export interface NewMessageMessage {
  type: 'new_message';
  data: MessageWithDetails;
  timestamp: string;
}

export interface MessageEditedMessage {
  type: 'message_edited';
  data: MessageWithDetails;
  timestamp: string;
}

export interface MessageDeletedMessage {
  type: 'message_deleted';
  message_id: string;
  deleted_by: string;
  channel_id: string;
}

export interface UserStatusMessage {
  type: 'user_status';
  user_id: string;
  status: 'online' | 'offline';
  timestamp: string;
}

export interface MentionNotificationMessage {
  type: 'mention_notification';
  data: {
    message_id: string;
    channel_id: string;
    content: string;
    from_user_id: string;
    from_username: string;
  };
  timestamp: string;
}

export interface ErrorMessage {
  type: 'error';
  error_code: string;
  message: string;
  details?: string;
}

export type ServerMessage = 
  | ConnectionEstablishedMessage
  | NewMessageMessage
  | MessageEditedMessage
  | MessageDeletedMessage
  | UserStatusMessage
  | MentionNotificationMessage
  | ErrorMessage;

export type ClientMessage = 
  | JoinChannelMessage
  | LeaveChannelMessage
  | TypingIndicatorMessage
  | PingMessage
  | GetOnlineUsersMessage; 