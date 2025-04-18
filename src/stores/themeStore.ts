import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            theme: persistedState.theme || 'system',
          };
        }
        return persistedState;
      },
    }
  )
);