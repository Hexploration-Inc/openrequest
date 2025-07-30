import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarWidth: 320,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
}));