import { User } from './auth';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelWithMembers extends Channel {
  members: User[];
  member_count: number;
}

export interface ChannelCreate {
  name: string;
  description?: string;
}

export interface MessageFormatting {
  has_bold: boolean;
  has_italic: boolean;
  has_code: boolean;
  has_code_block: boolean;
  has_links: boolean;
  has_mentions: boolean;
  has_emojis: boolean;
  link_count: number;
  mention_count: number;
  emoji_count: number;
}

export interface Message {
  id: string;
  content: string;
  user_id: string;
  channel_id: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  formatting?: MessageFormatting;
}

export interface MessageWithUser extends Message {
  user: User;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  message_id: string;
  created_at: string;
  user: User;
}

export interface MessageWithDetails extends MessageWithUser {
  reactions: MessageReaction[];
  mention_count: number;
}

export interface MessageCreate {
  content: string;
  channel_id: string;
}

export interface TypingIndicator {
  user_id: string;
  username: string;
  channel_id: string;
  is_typing: boolean;
  timestamp: string;
}

export interface ChatState {
  channels: ChannelWithMembers[];
  currentChannel: string | null;
  messages: Map<string, MessageWithDetails[]>;
  typingUsers: Map<string, TypingIndicator[]>;
  onlineUsers: Set<string>;
} 