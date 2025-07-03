import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@repo/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hasSeenWelcome: boolean; // Track if user has seen welcome screen
  
  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  resetWelcome: () => void;
  
  // Computed
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  resetWelcome: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        loading: false,
        hasSeenWelcome: false,
        isAuthenticated: false,
        
        // Computed
        get isAuthenticated() {
          const { user, token } = get();
          return !!(user && token);
        },
        
        // Actions
        setAuth: (user: User, token: string) => {
          console.log("🏪 AuthStore: Setting auth", { user: user.username, hasToken: !!token });
          set(
            {
              user,
              token,
              isAuthenticated: true,
              loading: false,
            },
            false,
            "setAuth"
          );
        },
        clearAuth: () => {
          console.log("🏪 AuthStore: Clearing auth");
          set(
            {
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            },
            false,
            "clearAuth"
          );
        },
        setLoading: (loading: boolean) => {
          console.log("�� AuthStore: Setting loading", loading);
          set({ loading }, false, "setLoading");
        },
        setUser: (user: User) => {
          console.log("🏪 AuthStore: Setting user", user.username);
          set({ user }, false, "setUser");
        },
        setHasSeenWelcome: (seen: boolean) => {
          console.log("🏪 AuthStore: Setting hasSeenWelcome", seen);
          set({ hasSeenWelcome: seen }, false, "setHasSeenWelcome");
          // Also persist to persistence store
          import('@/lib/store/persistenceStore').then(({ usePersistenceStore }) => {
            usePersistenceStore.getState().setHasSeenWelcome(seen);
          });
        },
        resetWelcome: () => {
          console.log("🏪 AuthStore: Resetting welcome screen");
          set({ hasSeenWelcome: false }, false, "resetWelcome");
          // Also reset in persistence store
          import('@/lib/store/persistenceStore').then(({ usePersistenceStore }) => {
            usePersistenceStore.getState().setHasSeenWelcome(false);
          });
        },
      }),
      {
        name: 'pythia-auth-store',
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          hasSeenWelcome: state.hasSeenWelcome,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
); 