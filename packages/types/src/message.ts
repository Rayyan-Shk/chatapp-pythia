import { User } from './user';

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
  user?: User;
  mentions?: string[];
  reactions?: MessageReaction[];
}

export interface MessageWithUser extends Message {
  user: User;
}

export interface MessageWithDetails extends MessageWithUser {
  mentions: string[];
  reactions: MessageReaction[];
  mention_count: number;
}

export interface CreateMessageRequest {
  content: string;
  channel_id: string;
  mentions?: string[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  message_id: string;
  created_at: string;
  user: User;
}

export interface TypingIndicator {
  user_id: string;
  channel_id: string;
  is_typing: boolean;
  timestamp: string;
} 