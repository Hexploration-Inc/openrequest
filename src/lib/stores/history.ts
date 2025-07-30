import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HttpMethod, ApiResponse } from '../types';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  method: HttpMethod;
  url: string;
  status?: number;
  responseTime?: number;
  size?: number;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  bodyContent?: string;
  response?: ApiResponse;
}

interface HistoryState {
  history: HistoryEntry[];
  maxHistorySize: number;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  getHistoryByUrl: (url: string) => HistoryEntry[];
  clearHistory: () => void;
  removeHistoryEntry: (id: string) => void;
  getRecentUrls: (limit?: number) => string[];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      maxHistorySize: 100,

      addHistoryEntry: (entry) => {
        const id = `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const timestamp = Date.now();
        
        const newEntry: HistoryEntry = {
          ...entry,
          id,
          timestamp,
        };

        set((state) => {
          const newHistory = [newEntry, ...state.history];
          
          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.splice(state.maxHistorySize);
          }
          
          return { history: newHistory };
        });
      },

      getHistoryByUrl: (url: string) => {
        const { history } = get();
        return history.filter((entry) => entry.url === url);
      },

      clearHistory: () => {
        set({ history: [] });
      },

      removeHistoryEntry: (id: string) => {
        set((state) => ({
          history: state.history.filter((entry) => entry.id !== id),
        }));
      },

      getRecentUrls: (limit = 10) => {
        const { history } = get();
        const uniqueUrls = Array.from(new Set(history.map((entry) => entry.url)));
        return uniqueUrls.slice(0, limit);
      },
    }),
    {
      name: 'openrequest-history',
      version: 1,
    }
  )
);