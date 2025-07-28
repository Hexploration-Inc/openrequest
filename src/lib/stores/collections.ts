import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Collection, Request } from '../types';

interface CollectionsState {
  // State
  collections: Collection[];
  selectedCollectionId: string | null;
  requests: Request[];
  isDbInitialized: boolean;
  
  // Actions
  initializeDatabase: () => Promise<void>;
  loadCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<void>;
  selectCollection: (id: string) => Promise<void>;
  loadRequestsForCollection: (collectionId: string) => Promise<void>;
  createRequest: (collectionId: string, name: string, method: string, url: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  // Initial state
  collections: [],
  selectedCollectionId: null,
  requests: [],
  isDbInitialized: false,

  // Initialize database
  initializeDatabase: async () => {
    try {
      const result = await invoke<string>("init_database");
      console.log("✅ Database initialized:", result);
      set({ isDbInitialized: true });
      await get().loadCollections();
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      set({ isDbInitialized: false });
      throw error;
    }
  },

  // Load all collections
  loadCollections: async () => {
    try {
      const collections = await invoke<Collection[]>("get_collections");
      set({ collections });
    } catch (error) {
      console.error("❌ Failed to load collections:", error);
      throw error;
    }
  },

  // Create new collection
  createCollection: async (name: string, description?: string) => {
    try {
      await invoke("create_collection", {
        name,
        description: description || null,
        parentId: null,
      });
      await get().loadCollections();
    } catch (error) {
      console.error("❌ Failed to create collection:", error);
      throw error;
    }
  },

  // Select a collection and load its requests
  selectCollection: async (id: string) => {
    set({ selectedCollectionId: id });
    await get().loadRequestsForCollection(id);
  },

  // Load requests for a specific collection
  loadRequestsForCollection: async (collectionId: string) => {
    try {
      const requests = await invoke<Request[]>("get_requests_by_collection", {
        collectionId,
      });
      set({ requests });
    } catch (error) {
      console.error("Failed to load requests:", error);
      throw error;
    }
  },

  // Create new request
  createRequest: async (collectionId: string, name: string, method: string, url: string) => {
    console.log("🏪 Store: createRequest called with:", { collectionId, name, method, url });
    
    try {
      console.log("🔄 Store: Invoking Tauri command 'create_request'...");
      const result = await invoke("create_request", {
        collectionId,
        name,
        method,
        url,
      });
      console.log("✅ Store: create_request command successful, result:", result);
      
      console.log("🔄 Store: Loading requests for collection...");
      await get().loadRequestsForCollection(collectionId);
      console.log("✅ Store: Requests reloaded successfully");
    } catch (error) {
      console.error("❌ Store: Failed to create request:", error);
      console.error("❌ Store: Error type:", typeof error);
      console.error("❌ Store: Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },
}));