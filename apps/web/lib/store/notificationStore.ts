import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationData, NotificationSettings, NotificationPreferences } from '@repo/types';

interface NotificationState {
  // Notifications
  notifications: NotificationData[];
  unreadCount: number;
  
  // Settings
  preferences: NotificationPreferences;
  
  // UI state
  panelOpen: boolean;
  permissionGranted: boolean;
  
  // Actions
  addNotification: (notification: Omit<NotificationData, 'id' | 'created_at'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Settings actions
  updateGlobalSettings: (settings: Partial<NotificationSettings>) => void;
  updateChannelSettings: (channelId: string, settings: Partial<NotificationSettings>) => void;
  
  // UI actions
  setPanelOpen: (open: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
  
  // Notification actions
  requestPermission: () => Promise<boolean>;
  showDesktopNotification: (notification: NotificationData) => void;
  playNotificationSound: () => void;
  
  // Computed getters
  getChannelSettings: (channelId: string) => NotificationSettings;
  shouldNotify: (type: NotificationData['type'], channelId?: string) => boolean;
  
  reset: () => void;
}

const defaultGlobalSettings: NotificationSettings = {
  mentions: true,
  messages: true,
  channel_activity: true,
  file_uploads: true,
  reactions: true,
  sound_enabled: true,
  desktop_enabled: true,
  email_enabled: false,
  digest_frequency: 'immediate',
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      preferences: {
        global: defaultGlobalSettings,
        channels: {},
      },
      panelOpen: false,
      permissionGranted: false,
      
      // Computed getters
      getChannelSettings: (channelId: string) => {
        const state = get();
        const channelSettings = state.preferences.channels[channelId] || {};
        return { ...state.preferences.global, ...channelSettings };
      },
      
      shouldNotify: (type, channelId) => {
        const state = get();
        const settings = channelId 
          ? state.getChannelSettings(channelId)
          : state.preferences.global;
        
        switch (type) {
          case 'mention':
            return settings.mentions;
          case 'message':
            return settings.messages;
          case 'channel_invite':
          case 'user_joined':
          case 'user_left':
            return settings.channel_activity;
          case 'file_shared':
            return settings.file_uploads;
          case 'reaction_added':
            return settings.reactions;
          default:
            return true;
        }
      },
      
      // Actions
      addNotification: (notificationData) => {
        const notification: NotificationData = {
          ...notificationData,
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100), // Keep last 100
          unreadCount: state.unreadCount + 1,
        }));
        
        // Show desktop notification if enabled
        const state = get();
        if (state.shouldNotify(notification.type, notification.channel_id)) {
          if (state.preferences.global.desktop_enabled && state.permissionGranted) {
            state.showDesktopNotification(notification);
          }
          
          if (state.preferences.global.sound_enabled) {
            state.playNotificationSound();
          }
        }
      },
      
      markAsRead: (notificationId) => set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        if (!notification || notification.read) return state;
        
        return {
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),
      
      removeNotification: (notificationId) => set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      }),
      
      clearAllNotifications: () => set({
        notifications: [],
        unreadCount: 0,
      }),
      
      // Settings actions
      updateGlobalSettings: (settings) => set((state) => ({
        preferences: {
          ...state.preferences,
          global: { ...state.preferences.global, ...settings },
        },
      })),
      
      updateChannelSettings: (channelId, settings) => set((state) => ({
        preferences: {
          ...state.preferences,
          channels: {
            ...state.preferences.channels,
            [channelId]: { ...state.preferences.channels[channelId], ...settings },
          },
        },
      })),
      
      // UI actions
      setPanelOpen: (open) => set({ panelOpen: open }),
      setPermissionGranted: (granted) => set({ permissionGranted: granted }),
      
      // Notification actions
      requestPermission: async () => {
        if (!('Notification' in window)) {
          console.warn('This browser does not support desktop notifications');
          return false;
        }
        
        if (Notification.permission === 'granted') {
          set({ permissionGranted: true });
          return true;
        }
        
        if (Notification.permission === 'denied') {
          set({ permissionGranted: false });
          return false;
        }
        
        try {
          const permission = await Notification.requestPermission();
          const granted = permission === 'granted';
          set({ permissionGranted: granted });
          return granted;
        } catch (error) {
          console.error('Failed to request notification permission:', error);
          set({ permissionGranted: false });
          return false;
        }
      },
      
      showDesktopNotification: (notification) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
          return;
        }
        
        try {
          const desktopNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: false,
            silent: false,
          });
          
          // Auto close after 5 seconds
          setTimeout(() => {
            desktopNotification.close();
          }, 5000);
          
          // Handle click to navigate to relevant content
          desktopNotification.onclick = () => {
            window.focus();
            if (notification.action_url) {
              window.location.href = notification.action_url;
            }
            desktopNotification.close();
          };
        } catch (error) {
          console.error('Failed to show desktop notification:', error);
        }
      },
      
      playNotificationSound: () => {
        try {
          // Create a simple notification sound
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          console.warn('Could not play notification sound:', error);
        }
      },
      
      reset: () => set({
        notifications: [],
        unreadCount: 0,
        preferences: {
          global: defaultGlobalSettings,
          channels: {},
        },
        panelOpen: false,
        permissionGranted: false,
      }),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        permissionGranted: state.permissionGranted,
      }),
    }
  )
); 