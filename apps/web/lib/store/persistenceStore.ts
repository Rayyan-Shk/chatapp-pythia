import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersistenceState {
  // Active channel persistence
  activeChannelId: string | null;
  
  // Draft messages per channel
  draftMessages: Record<string, string>; // channelId -> draft content
  
  // Welcome screen state
  hasSeenWelcome: boolean;
  
  // Actions
  setActiveChannelId: (channelId: string | null) => void;
  
  // Draft message actions
  saveDraftMessage: (channelId: string, content: string) => void;
  getDraftMessage: (channelId: string) => string;
  clearDraftMessage: (channelId: string) => void;
  
  // Welcome screen actions
  setHasSeenWelcome: (seen: boolean) => void;
  
  // Utility actions
  clearAll: () => void;
}

export const usePersistenceStore = create<PersistenceState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeChannelId: null,
      draftMessages: {},
      hasSeenWelcome: false,
      
      // Actions
      setActiveChannelId: (channelId) => {
        console.log("💾 PersistenceStore: Setting active channel", channelId);
        set({ activeChannelId: channelId });
      },
      
      saveDraftMessage: (channelId, content) => {
        console.log("💾 PersistenceStore: Saving draft message", { channelId, contentLength: content.length });
        set((state) => ({
          draftMessages: {
            ...state.draftMessages,
            [channelId]: content
          }
        }));
      },
      
      getDraftMessage: (channelId) => {
        const state = get();
        const draft = state.draftMessages[channelId] || '';
        console.log("💾 PersistenceStore: Getting draft message", { channelId, draftLength: draft.length });
        return draft;
      },
      
      clearDraftMessage: (channelId) => {
        console.log("💾 PersistenceStore: Clearing draft message", channelId);
        set((state) => {
          const newDraftMessages = { ...state.draftMessages };
          delete newDraftMessages[channelId];
          return { draftMessages: newDraftMessages };
        });
      },
      
      setHasSeenWelcome: (seen) => {
        console.log("💾 PersistenceStore: Setting hasSeenWelcome", seen);
        set({ hasSeenWelcome: seen });
      },
      
      clearAll: () => {
        console.log("💾 PersistenceStore: Clearing all persistence data");
        set({
          activeChannelId: null,
          draftMessages: {},
          hasSeenWelcome: false
        });
      }
    }),
    {
      name: 'pythia-persistence-store',
      partialize: (state) => ({
        activeChannelId: state.activeChannelId,
        draftMessages: state.draftMessages,
        hasSeenWelcome: state.hasSeenWelcome
      })
    }
  )
); 