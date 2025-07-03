"use client";

import { useChatStore } from "@/lib/store/chatStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useWebSocketStore } from "@/lib/store/websocketStore";
import { toast } from "@/hooks/use-toast";
import { MessageWithDetails, User } from "@repo/types";

export interface WebSocketHandlers {
  onConnectionEstablished: (data: any) => void;
  onNewMessage: (data: any) => void;
  onMessageEdited: (data: any) => void;
  onMessageDeleted: (data: any) => void;
  onMessageReaction: (data: any) => void;
  onTypingIndicator: (data: any) => void;
  onUserStatus: (data: any) => void;
  onUserJoined: (data: any) => void;
  onUserLeft: (data: any) => void;
  onMentionNotification: (data: any) => void;
  onOnlineUsers: (data: any) => void;
  onChannelCreated: (data: any) => void;
  onError: (data: any) => void;
}

/**
 * Creates WebSocket message handlers with store integration
 */
export const createWebSocketHandlers = (): WebSocketHandlers => {
  const chatStore = useChatStore.getState();
  const authStore = useAuthStore.getState();
  const wsStore = useWebSocketStore.getState();

  return {
    onConnectionEstablished: (data) => {
      console.log("WebSocket connection established:", data);
      toast({
        title: "Connected",
        description: "Real-time chat connected successfully",
      });
    },

    onNewMessage: (data) => {
      try {
        const message: MessageWithDetails = data.data;
        
        if (!message.channel_id) {
          console.warn("Received message without channel_id:", message);
          return;
        }

        // Track message received
        wsStore.incrementMessagesReceived();

        // Add message to store
        chatStore.addMessage(message.channel_id, message as any);

        // Show notification if not current user and not in active channel
        const currentUser = authStore.user;
        const isOwnMessage = currentUser?.id === message.user_id;
        const isActiveChannel = chatStore.activeChannelId === message.channel_id;

        if (!isOwnMessage && !isActiveChannel) {
          toast({
            title: `New message in #${getChannelName(message.channel_id)}`,
            description: `${message.user.username}: ${truncateMessage(message.content)}`,
          });
        }
      } catch (error) {
        console.error("Error handling new message:", error);
      }
    },

    onMessageEdited: (data) => {
      try {
        const message: MessageWithDetails = data.data;
        
        if (!message.channel_id || !message.id) {
          console.warn("Received edited message without required fields:", message);
          return;
        }

        // Update message in store
        chatStore.updateMessage(message.channel_id, message.id, {
          ...message,
          is_edited: true,
        } as any);
      } catch (error) {
        console.error("Error handling message edit:", error);
      }
    },

    onMessageDeleted: (data) => {
      try {
        const { message_id, channel_id, deleted_by } = data;
        
        if (!message_id || !channel_id) {
          console.warn("Received delete message without required fields:", data);
          return;
        }

        // Remove message from store
        chatStore.removeMessage(channel_id, message_id);

        // Show notification if deleted by someone else
        const currentUser = authStore.user;
        if (deleted_by !== currentUser?.username) {
          toast({
            title: "Message deleted",
            description: `A message was deleted by ${deleted_by}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error handling message deletion:", error);
      }
    },

    onMessageReaction: (data) => {
      try {
        const { message_id, data: reactionData } = data;
        
        if (!message_id || !reactionData) {
          console.warn("Received reaction without required fields:", data);
          return;
        }

        console.log("🔄 Message reaction received:", data);
        
        // Get fresh store state to avoid stale references
        const freshChatStore = useChatStore.getState();
        const freshAuthStore = useAuthStore.getState();
        
        // We need to find the message across all channels
        // Since we don't have the channel_id in the WebSocket data, we'll search all channels
        const allChannels = freshChatStore.channels;
        let foundMessage: any = null;
        let foundChannelId: string = "";
        
        // Search through all channels to find the message
        for (const channel of allChannels) {
          const messages = freshChatStore.getChannelMessages(channel.id);
          const message = messages.find(msg => msg.id === message_id);
          if (message) {
            foundMessage = message;
            foundChannelId = channel.id;
            break;
          }
        }
        
        if (!foundMessage) {
          console.warn("❌ Message not found for reaction:", message_id);
          console.log("Available channels:", allChannels.map(c => ({ id: c.id, name: c.name })));
          console.log("Available messages:", allChannels.flatMap(c => freshChatStore.getChannelMessages(c.id).map(m => ({ id: m.id, channelId: c.id }))));
          return;
        }

        console.log("✅ Found message for reaction:", { messageId: message_id, channelId: foundChannelId });

        if (reactionData.action === "add") {
          // Create a reaction object with the required structure
          const reaction = {
            id: `temp_${Date.now()}`, // Temporary ID, will be updated when message is reloaded
            emoji: reactionData.emoji,
            user_id: reactionData.user_id,
            message_id: message_id,
            created_at: new Date().toISOString(),
            user: {
              id: reactionData.user_id,
              username: reactionData.username,
              email: "",
              avatar: "",
              status: "ACTIVE",
              created_at: "",
              updated_at: ""
            }
          };
          
          freshChatStore.addReaction(foundChannelId, message_id, reaction);
          console.log("✅ Reaction added to store:", { channelId: foundChannelId, messageId: message_id, reaction });
        } else if (reactionData.action === "remove") {
          // For removal, we need to find the reaction by user_id and emoji
          const messages = freshChatStore.getChannelMessages(foundChannelId);
          const message = messages.find(msg => msg.id === message_id);
          
          if (message && (message as any).reactions) {
            const reactionToRemove = (message as any).reactions.find((r: any) => 
              r.user_id === reactionData.user_id && r.emoji === reactionData.emoji
            );
            
            if (reactionToRemove) {
              freshChatStore.removeReaction(foundChannelId, message_id, reactionToRemove.id);
              console.log("✅ Reaction removed from store:", { channelId: foundChannelId, messageId: message_id, reactionId: reactionToRemove.id });
            }
          }
        }
        
        // Show toast for reactions from others
        const currentUser = freshAuthStore.user;
        if (reactionData.user_id !== currentUser?.id) {
          toast({
            title: `${reactionData.username} reacted`,
            description: `${reactionData.emoji} ${reactionData.action === 'add' ? 'added' : 'removed'}`,
          });
        }
      } catch (error) {
        console.error("❌ Error handling message reaction:", error);
      }
    },

    onTypingIndicator: (data) => {
      try {
        const { user_id, username, channel_id, is_typing } = data;
        
        if (!user_id || !username || !channel_id) {
          console.warn("Received typing indicator without required fields:", data);
          return;
        }

        // Don't show typing indicator for current user
        const currentUser = authStore.user;
        if (user_id === currentUser?.id) {
          return;
        }

        // Update typing users in store
        if (is_typing) {
          chatStore.addTypingUser(channel_id, user_id, username);
        } else {
          chatStore.removeTypingUser(channel_id, user_id);
        }
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    },

    onUserStatus: (data) => {
      try {
        const { user_id, status } = data;
        
        if (!user_id || !status) {
          console.warn("Received user status without required fields:", data);
          return;
        }

        console.log(`User ${user_id} is now ${status}`);
        
        // Here you could update user presence in a dedicated store
        // For now, just log the status change
      } catch (error) {
        console.error("Error handling user status:", error);
      }
    },

    onUserJoined: (data) => {
      try {
        const { user_id, channel_id, username } = data;
        
        if (!user_id || !channel_id) {
          console.warn("Received user joined without required fields:", data);
          return;
        }

        console.log(`User ${user_id} joined channel ${channel_id}`);
        
        // Check if it's the current user who joined
        const currentUser = authStore.user;
        const isCurrentUser = currentUser?.id === user_id;
        
        if (isCurrentUser) {
          // Current user joined a new channel - refresh channel list
          console.log("Current user joined a new channel, refreshing channel list");
          // Trigger a refresh of the channel list
          // This will be handled by the component that listens to this event
          window.dispatchEvent(new CustomEvent('refreshChannels'));
        } else {
          // Another user joined a channel - update member count and show notification
          const channelName = getChannelName(channel_id);
          const displayName = username || 'Someone';
          
          // Show notification
        toast({
          title: "User joined",
            description: `${displayName} joined #${channelName}`,
        });
          
          // Refresh channel members for this channel
          window.dispatchEvent(new CustomEvent('refreshChannelMembers', { 
            detail: { channelId: channel_id } 
          }));
        }
      } catch (error) {
        console.error("Error handling user joined:", error);
      }
    },

    onUserLeft: (data) => {
      try {
        const { user_id, channel_id, username } = data;
        
        if (!user_id || !channel_id) {
          console.warn("Received user left without required fields:", data);
          return;
        }

        console.log(`User ${user_id} left channel ${channel_id}`);
        
        // Remove from typing users if they were typing
        chatStore.removeTypingUser(channel_id, user_id);
        
        // Check if it's the current user who left
        const currentUser = authStore.user;
        const isCurrentUser = currentUser?.id === user_id;
        
        if (isCurrentUser) {
          // Current user left a channel - refresh channel list
          console.log("Current user left a channel, refreshing channel list");
          window.dispatchEvent(new CustomEvent('refreshChannels'));
        } else {
          // Another user left a channel - update member count and show notification
          const channelName = getChannelName(channel_id);
          const displayName = username || 'Someone';
          
          // Show notification
          toast({
            title: "User left",
            description: `${displayName} left #${channelName}`,
          });
          
          // Refresh channel members for this channel
          window.dispatchEvent(new CustomEvent('refreshChannelMembers', { 
            detail: { channelId: channel_id } 
          }));
        }
      } catch (error) {
        console.error("Error handling user left:", error);
      }
    },

    onMentionNotification: (data) => {
      try {
        const { data: mentionData } = data;
        
        if (!mentionData) {
          console.warn("Received mention notification without data:", data);
          return;
        }

        const { from_username, content, channel_id } = mentionData;
        
        // Show prominent mention notification
        toast({
          title: `${from_username} mentioned you`,
          description: truncateMessage(content),
          duration: 10000, // Show longer for mentions
        });

        // You could also play a sound or show a desktop notification here
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${from_username} mentioned you`, {
            body: truncateMessage(content),
            icon: '/favicon.ico',
          });
        }
      } catch (error) {
        console.error("Error handling mention notification:", error);
      }
    },

    onOnlineUsers: (data) => {
      try {
        const { channel_id, users } = data;
        
        if (!channel_id || !Array.isArray(users)) {
          console.warn("Received online users without required fields:", data);
          return;
        }

        console.log(`Online users in ${channel_id}:`, users);
        
        // Here you could update online users in the store
        // For now, just log the information
      } catch (error) {
        console.error("Error handling online users:", error);
      }
    },

    onChannelCreated: (data) => {
      try {
        const { data: channelData } = data;
        
        if (!channelData) {
          console.warn("Received channel created without data:", data);
          return;
        }

        console.log("New channel created:", channelData);
        
        // Refresh the channel list to show the new channel
        window.dispatchEvent(new CustomEvent('refreshChannels'));
        
        // Show notification
        toast({
          title: "New channel created",
          description: `#${channelData.name} is now available`,
        });
      } catch (error) {
        console.error("Error handling channel created:", error);
      }
    },

    onError: (data) => {
      try {
        const { error_code, message, details } = data;
        
        console.error("WebSocket error received:", data);
        
        // Show user-friendly error message
        let errorMessage = message || "An error occurred";
        
        switch (error_code) {
          case "access_denied":
            errorMessage = "Access denied to channel";
            break;
          case "invalid_json":
            errorMessage = "Invalid message format";
            break;
          case "unknown_message_type":
            errorMessage = "Unknown message type";
            break;
          case "missing_channel_id":
            errorMessage = "Channel ID is required";
            break;
          default:
            errorMessage = message || "Connection error occurred";
        }

        toast({
          title: "Connection Error",
          description: errorMessage,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Error handling WebSocket error:", error);
      }
    },
  };
};

// Helper functions
function getChannelName(channelId: string): string {
  const chatStore = useChatStore.getState();
  const channel = chatStore.channels.find(c => c.id === channelId);
  return channel?.name || "Unknown Channel";
}

function truncateMessage(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "...";
}

/**
 * Register all WebSocket handlers with the client
 */
export const registerWebSocketHandlers = (wsClient: any) => {
  const handlers = createWebSocketHandlers();

  // Register all handlers
  const unsubscribeFunctions = [
    wsClient.on("connection_established", handlers.onConnectionEstablished),
    wsClient.on("new_message", handlers.onNewMessage),
    wsClient.on("message_edited", handlers.onMessageEdited),
    wsClient.on("message_deleted", handlers.onMessageDeleted),
    wsClient.on("message_reaction", handlers.onMessageReaction),
    wsClient.on("typing_indicator", handlers.onTypingIndicator),
    wsClient.on("user_status", handlers.onUserStatus),
    wsClient.on("user_joined", handlers.onUserJoined),
    wsClient.on("user_left", handlers.onUserLeft),
    wsClient.on("mention_notification", handlers.onMentionNotification),
    wsClient.on("online_users", handlers.onOnlineUsers),
    wsClient.on("channel_created", handlers.onChannelCreated),
    wsClient.on("error", handlers.onError),
  ];

  // Return cleanup function
  return () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  };
}; 