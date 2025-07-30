import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Collection, Request } from '../types';

interface CollectionsState {
  // State
  collections: Collection[];
  selectedCollectionId: string | null;
  requests: Record<string, Request[]>; // Map collection ID to its requests
  isDbInitialized: boolean;
  
  // Actions
  initializeDatabase: () => Promise<void>;
  loadCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<void>;
  selectCollection: (id: string) => Promise<void>;
  loadRequestsForCollection: (collectionId: string) => Promise<void>;
  createRequest: (collectionId: string, name: string, method: string, url: string) => Promise<void>;
  updateCollection: (id: string, name: string, description?: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateRequest: (id: string, name: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  getRequestsForCollection: (collectionId: string) => Request[];
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  // Initial state
  collections: [],
  selectedCollectionId: null,
  requests: {},
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
      set((state) => ({
        requests: {
          ...state.requests,
          [collectionId]: requests,
        },
      }));
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
      
      // Auto-select the collection if no collection is currently selected
      const currentState = get();
      if (!currentState.selectedCollectionId) {
        set({ selectedCollectionId: collectionId });
      }
    } catch (error) {
      console.error("❌ Store: Failed to create request:", error);
      console.error("❌ Store: Error type:", typeof error);
      console.error("❌ Store: Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },

  // Update collection
  updateCollection: async (id: string, name: string, description?: string) => {
    try {
      const collection = get().collections.find(c => c.id === id);
      if (!collection) throw new Error("Collection not found");
      
      const updatedCollection = {
        ...collection,
        name,
        description: description || null,
      };
      
      await invoke("update_collection", { collection: updatedCollection });
      await get().loadCollections();
    } catch (error) {
      console.error("Failed to update collection:", error);
      throw error;
    }
  },

  // Delete collection
  deleteCollection: async (id: string) => {
    try {
      console.log("🗑️ Store: deleteCollection called with id:", id);
      console.log("🔄 Store: Invoking Tauri command 'delete_collection'...");
      
      await invoke("delete_collection", { id });
      console.log("✅ Store: delete_collection command successful");
      
      console.log("🔄 Store: Reloading collections...");
      await get().loadCollections();
      console.log("✅ Store: Collections reloaded");
      
      // Clear requests for this collection and update selected collection if needed
      set((state) => {
        const newRequests = { ...state.requests };
        delete newRequests[id];
        
        return {
          requests: newRequests,
          selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
        };
      });
      console.log("✅ Store: State updated after collection deletion");
    } catch (error) {
      console.error("❌ Store: Failed to delete collection:", error);
      console.error("❌ Store: Error type:", typeof error);
      console.error("❌ Store: Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },

  // Update request
  updateRequest: async (id: string, name: string) => {
    try {
      const currentRequests = get().requests;
      let requestToUpdate: Request | null = null;
      let collectionId = "";
      
      // Find the request across all collections
      for (const [cId, requests] of Object.entries(currentRequests)) {
        const request = requests.find(r => r.id === id);
        if (request) {
          requestToUpdate = request;
          collectionId = cId;
          break;
        }
      }
      
      if (!requestToUpdate) throw new Error("Request not found");
      
      const updatedRequest = {
        ...requestToUpdate,
        name,
      };
      
      await invoke("update_request", { request: updatedRequest });
      await get().loadRequestsForCollection(collectionId);
    } catch (error) {
      console.error("Failed to update request:", error);
      throw error;
    }
  },

  // Delete request
  deleteRequest: async (id: string) => {
    try {
      console.log("🗑️ Store: deleteRequest called with id:", id);
      console.log("🔄 Store: Invoking Tauri command 'delete_request'...");
      
      await invoke("delete_request", { id });
      console.log("✅ Store: delete_request command successful");
      
      // Find which collection this request belongs to and reload its requests
      const currentRequests = get().requests;
      console.log("🔍 Store: Looking for request in collections:", Object.keys(currentRequests));
      
      for (const [collectionId, requests] of Object.entries(currentRequests)) {
        if (requests.some(r => r.id === id)) {
          console.log("📍 Store: Found request in collection:", collectionId);
          console.log("🔄 Store: Reloading requests for collection...");
          await get().loadRequestsForCollection(collectionId);
          console.log("✅ Store: Requests reloaded for collection");
          break;
        }
      }
    } catch (error) {
      console.error("❌ Store: Failed to delete request:", error);
      console.error("❌ Store: Error type:", typeof error);
      console.error("❌ Store: Error details:", JSON.stringify(error, null, 2));
      throw error;
    }
  },

  // Get requests for a specific collection
  getRequestsForCollection: (collectionId: string) => {
    return get().requests[collectionId] || [];
  },
}));