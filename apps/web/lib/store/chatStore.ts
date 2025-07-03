import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Channel, Message, User } from '@repo/types';
import { ReplyContext } from '@/lib/utils/replyUtils';
import { usePersistenceStore } from './persistenceStore';
import { useAuthStore } from './authStore';

interface ChatState {
  // Channels
  channels: Channel[];
  activeChannelId: string | null;
  channelMembers: Record<string, User[]>;
  
  // Messages
  messages: Record<string, Message[]>;
  messageLoading: boolean;
  
  // UI State
  sidebarOpen: boolean;
  
  // Reply context
  replyTo: ReplyContext | null;
  
  // Typing indicators
  typingUsers: Record<string, Array<{ userId: string; username: string }>>; // channelId -> typing users
  
  // Users
  onlineUsers: Record<string, User[]>; // channelId -> users
  
  // Loading states
  loadingChannels: boolean;
  loadingMessages: Record<string, boolean>;
  
  // Actions
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;
  
  setActiveChannelId: (channelId: string | null) => void;
  
  setChannelMembers: (channelId: string, members: User[]) => void;
  addChannelMember: (channelId: string, member: User) => void;
  removeChannelMember: (channelId: string, userId: string) => void;
  
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (channelId: string, message: Message) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (channelId: string, messageId: string) => void;
  prependMessages: (channelId: string, messages: Message[]) => void;
  
  // Reaction actions
  addReaction: (channelId: string, messageId: string, reaction: any) => void;
  removeReaction: (channelId: string, messageId: string, reactionId: string) => void;
  
  setMessageLoading: (loading: boolean) => void;
  
  setSidebarOpen: (open: boolean) => void;
  
  // Reply actions
  setReplyTo: (reply: ReplyContext | null) => void;
  clearReply: () => void;
  
  setTypingUsers: (channelId: string, users: Array<{ userId: string; username: string }>) => void;
  addTypingUser: (channelId: string, userId: string, username: string) => void;
  removeTypingUser: (channelId: string, userId: string) => void;
  
  setOnlineUsers: (channelId: string, users: User[]) => void;
  
  setLoadingChannels: (loading: boolean) => void;
  setLoadingMessages: (channelId: string, loading: boolean) => void;
  
  // Computed getters
  getActiveChannel: () => Channel | null;
  getChannelMessages: (channelId: string) => Message[];
  getChannelMembers: (channelId: string) => User[];
  getTypingUsers: (channelId: string) => Array<{ userId: string; username: string }>;
  
  reset: () => void;
  initializeFromPersistence: () => void;
}

interface ChatActions {
  // Channel actions
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  setActiveChannelId: (channelId: string | null) => void;
  
  // Message actions
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (channelId: string, message: Message) => void;
  updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (channelId: string, messageId: string) => void;
  
  // User actions
  setOnlineUsers: (channelId: string, users: User[]) => void;
  setTypingUsers: (channelId: string, users: Array<{ userId: string; username: string }>) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  
  // Loading actions
  setLoadingChannels: (loading: boolean) => void;
  setLoadingMessages: (channelId: string, loading: boolean) => void;
  
  // Utility actions
  reset: () => void;
}

type ChatStore = ChatState & ChatActions;

const initialState = {
  channels: [],
  activeChannelId: null,
  channelMembers: {},
  messages: {},
  messageLoading: false,
  sidebarOpen: true,
  replyTo: null,
  typingUsers: {},
  onlineUsers: {},
  loadingChannels: false,
  loadingMessages: {},
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Channel actions
      setChannels: (channels) => {
        console.log("🏪 ChatStore: Setting channels", { count: channels.length });
        set({ channels }, false, "setChannels");
      },

      addChannel: (channel) => {
        console.log("🏪 ChatStore: Adding channel", channel.name);
        set(
          (state) => ({
            channels: [...state.channels, channel],
          }),
          false,
          "addChannel"
        );
      },

      updateChannel: (channelId, updates) => set((state) => ({
        channels: state.channels.map(channel => 
          channel.id === channelId ? { ...channel, ...updates } : channel
        )
      })),

      removeChannel: (channelId) => set((state) => {
        const newMessages = { ...state.messages };
        delete newMessages[channelId];
        
        const newChannelMembers = { ...state.channelMembers };
        delete newChannelMembers[channelId];
        
        return {
          channels: state.channels.filter(channel => channel.id !== channelId),
          messages: newMessages,
          channelMembers: newChannelMembers,
          activeChannelId: state.activeChannelId === channelId ? null : state.activeChannelId
        };
      }),

      setActiveChannelId: (channelId) => {
        console.log("🏪 ChatStore: Setting active channel", channelId);
        set({ activeChannelId: channelId }, false, "setActiveChannelId");
        // Persist active channel using persistence store
        usePersistenceStore.getState().setActiveChannelId(channelId);
        // Mark welcome as seen if a channel is selected
        if (channelId) {
          useAuthStore.getState().setHasSeenWelcome(true);
        }
      },

      // Member actions
      setChannelMembers: (channelId, members) => set((state) => ({
        channelMembers: {
          ...state.channelMembers,
          [channelId]: members
        }
      })),
      
      addChannelMember: (channelId, member) => set((state) => ({
        channelMembers: {
          ...state.channelMembers,
          [channelId]: [...(state.channelMembers[channelId] || []), member]
        }
      })),
      
      removeChannelMember: (channelId, userId) => set((state) => ({
        channelMembers: {
          ...state.channelMembers,
          [channelId]: (state.channelMembers[channelId] || []).filter(member => member.id !== userId)
        }
      })),

      // Message actions
      setMessages: (channelId, messages) => {
        console.log("🏪 ChatStore: Setting messages for channel", { channelId, count: messages.length });
        set(
          (state) => ({
            messages: {
              ...state.messages,
              [channelId]: messages,
            },
          }),
          false,
          "setMessages"
        );
      },

      addMessage: (channelId, message) => {
        console.log("🏪 ChatStore: Adding message", { channelId, messageId: message.id });
        set(
          (state) => ({
            messages: {
              ...state.messages,
              [channelId]: [
                ...(state.messages[channelId] || []),
                message,
              ],
            },
          }),
          false,
          "addMessage"
        );
      },

      updateMessage: (channelId, messageId, updates) => {
        console.log("🏪 ChatStore: Updating message", { channelId, messageId });
        set(
          (state) => ({
            messages: {
              ...state.messages,
              [channelId]: (state.messages[channelId] || []).map((msg) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
            },
          }),
          false,
          "updateMessage"
        );
      },

      removeMessage: (channelId, messageId) => {
        console.log("🏪 ChatStore: Removing message", { channelId, messageId });
        set(
          (state) => ({
            messages: {
              ...state.messages,
              [channelId]: (state.messages[channelId] || []).filter(
                (msg) => msg.id !== messageId
              ),
            },
          }),
          false,
          "removeMessage"
        );
      },

      prependMessages: (channelId, messages) => set((state) => ({
        messages: {
          ...state.messages,
          [channelId]: [...messages, ...(state.messages[channelId] || [])]
        }
      })),

      // Reaction actions
      addReaction: (channelId, messageId, reaction) => {
        console.log("🏪 ChatStore: Adding reaction", { channelId, messageId, reaction });
        set((state) => {
          const channelMessages = state.messages[channelId] || [];
          console.log("🏪 ChatStore: Current messages in channel", channelId, channelMessages.length);
          
          const updatedMessages = channelMessages.map((msg) => {
            if (msg.id === messageId) {
              const existingReactions = (msg as any).reactions || [];
              const reactionExists = existingReactions.some((r: any) => 
                r.user_id === reaction.user_id && r.emoji === reaction.emoji
              );
              
              if (!reactionExists) {
                const updatedMessage = {
                  ...msg,
                  reactions: [...existingReactions, reaction]
                };
                console.log("🏪 ChatStore: Updated message with reaction", { 
                  messageId, 
                  oldReactionsCount: existingReactions.length,
                  newReactionsCount: updatedMessage.reactions.length,
                  reaction
                });
                return updatedMessage;
              } else {
                console.log("🏪 ChatStore: Reaction already exists, skipping", { messageId, reaction });
              }
            }
            return msg;
          });
          
          const newState = {
            messages: {
              ...state.messages,
              [channelId]: updatedMessages
            }
          };
          
          console.log("🏪 ChatStore: State updated", { 
            channelId, 
            messageCount: updatedMessages.length,
            hasReactions: updatedMessages.some(m => (m as any).reactions?.length > 0)
          });
          
          return newState;
        });
      },

      removeReaction: (channelId, messageId, reactionId) => {
        console.log("🏪 ChatStore: Removing reaction", { channelId, messageId, reactionId });
        set((state) => ({
          messages: {
            ...state.messages,
            [channelId]: (state.messages[channelId] || []).map((msg) => {
              if (msg.id === messageId) {
                const existingReactions = (msg as any).reactions || [];
                return {
                  ...msg,
                  reactions: existingReactions.filter((r: any) => r.id !== reactionId)
                };
              }
              return msg;
            })
          }
        }));
      },

      setMessageLoading: (loading) => set({ messageLoading: loading }),

      // UI actions
      setSidebarOpen: (open) => {
        console.log("🏪 ChatStore: Setting sidebar open", open);
        set({ sidebarOpen: open }, false, "setSidebarOpen");
      },

      // Reply actions
      setReplyTo: (reply) => {
        console.log("🏪 ChatStore: Setting reply to", reply);
        set({ replyTo: reply }, false, "setReplyTo");
      },

      clearReply: () => {
        console.log("🏪 ChatStore: Clearing reply");
        set({ replyTo: null }, false, "clearReply");
      },

      // Typing actions
      setTypingUsers: (channelId, users) => set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [channelId]: users
        }
      })),

      addTypingUser: (channelId, userId, username) => set((state) => {
        const currentTyping = state.typingUsers[channelId] || [];
        if (currentTyping.some(user => user.userId === userId)) return state;
        
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: [...currentTyping, { userId, username }]
          }
        };
      }),

      removeTypingUser: (channelId, userId) => set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [channelId]: (state.typingUsers[channelId] || []).filter(user => user.userId !== userId)
        }
      })),

      // User actions
      setOnlineUsers: (channelId, users) => {
        console.log("🏪 ChatStore: Setting online users", { channelId, count: users.length });
        set(
          (state) => ({
            onlineUsers: {
              ...state.onlineUsers,
              [channelId]: users,
            },
          }),
          false,
          "setOnlineUsers"
        );
      },

      // Loading actions
      setLoadingChannels: (loading) => {
        console.log("🏪 ChatStore: Setting loading channels", loading);
        set({ loadingChannels: loading }, false, "setLoadingChannels");
      },

      setLoadingMessages: (channelId, loading) => {
        console.log("🏪 ChatStore: Setting loading messages", { channelId, loading });
        set(
          (state) => ({
            loadingMessages: {
              ...state.loadingMessages,
              [channelId]: loading,
            },
          }),
          false,
          "setLoadingMessages"
        );
      },

      // Computed getters
      getActiveChannel: () => {
        const state = get();
        if (!state.activeChannelId) return null;
        return state.channels.find(channel => channel.id === state.activeChannelId) || null;
      },

      getChannelMessages: (channelId) => {
        const state = get();
        return state.messages[channelId] || [];
      },

      getChannelMembers: (channelId) => {
        const state = get();
        return state.channelMembers[channelId] || [];
      },

      getTypingUsers: (channelId) => {
        const state = get();
        return state.typingUsers[channelId] || [];
      },

      // Utility actions
      reset: () => {
        console.log("🏪 ChatStore: Resetting store");
        set(initialState, false, "reset");
        usePersistenceStore.getState().clearAll();
      },

      // Initialize from persistence
      initializeFromPersistence: () => {
        const persistenceStore = usePersistenceStore.getState();
        const savedChannelId = persistenceStore.activeChannelId;
        const savedHasSeenWelcome = persistenceStore.hasSeenWelcome;
        
        if (savedChannelId) {
          console.log("🏪 ChatStore: Restoring active channel from persistence", savedChannelId);
          set({ activeChannelId: savedChannelId }, false, "initializeFromPersistence");
        }
        
        if (savedHasSeenWelcome) {
          console.log("🏪 ChatStore: Restoring welcome screen state from persistence", savedHasSeenWelcome);
          useAuthStore.getState().setHasSeenWelcome(savedHasSeenWelcome);
        }
      },
    }),
    {
      name: "chat-store",
    }
  )
); 