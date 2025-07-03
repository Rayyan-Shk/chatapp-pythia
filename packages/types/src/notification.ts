export type NotificationType = 
  | 'mention' 
  | 'message' 
  | 'channel_invite' 
  | 'user_joined' 
  | 'user_left'
  | 'file_shared'
  | 'reaction_added';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel_id?: string;
  channel_name?: string;
  user_id?: string;
  username?: string;
  message_id?: string;
  file_url?: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

export interface NotificationSettings {
  mentions: boolean;
  messages: boolean;
  channel_activity: boolean;
  file_uploads: boolean;
  reactions: boolean;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  email_enabled: boolean;
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'never';
}

export interface NotificationPreferences {
  global: NotificationSettings;
  channels: Record<string, Partial<NotificationSettings>>;
} 