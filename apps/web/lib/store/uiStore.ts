import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Theme
  theme: Theme;
  
  // Notifications
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  
  // Layout
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Modal state
  modals: {
    createChannel: boolean;
    addUser: boolean;
    userProfile: boolean;
    settings: boolean;
    imagePreview: boolean;
  };
  
  // Actions
  setTheme: (theme: Theme) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial State
      theme: 'system',
      notificationsEnabled: true,
      soundEnabled: true,
      sidebarCollapsed: false,
      compactMode: false,
      modals: {
        createChannel: false,
        addUser: false,
        userProfile: false,
        settings: false,
        imagePreview: false,
      },
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCompactMode: (compact) => set({ compactMode: compact }),
      
      openModal: (modal) => set((state) => ({
        modals: {
          ...state.modals,
          [modal]: true
        }
      })),
      
      closeModal: (modal) => set((state) => ({
        modals: {
          ...state.modals,
          [modal]: false
        }
      })),
      
      closeAllModals: () => set({
        modals: {
          createChannel: false,
          addUser: false,
          userProfile: false,
          settings: false,
          imagePreview: false,
        }
      }),
      
      reset: () => set({
        theme: 'system',
        notificationsEnabled: true,
        soundEnabled: true,
        sidebarCollapsed: false,
        compactMode: false,
        modals: {
          createChannel: false,
          addUser: false,
          userProfile: false,
          settings: false,
          imagePreview: false,
        }
      })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
        compactMode: state.compactMode,
      }),
    }
  )
); 