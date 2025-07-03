import { User } from './user';
import { Message } from './message';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  lastMessage?: Message;
  is_public?: boolean;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
}

export interface ChannelMember {
  id: string;
  user_id: string;
  channel_id: string;
  joined_at: string;
  user?: User;
}

export interface JoinChannelRequest {
  channel_id: string;
}

export interface ChannelWithMembers extends Channel {
  members: ChannelMember[];
} 