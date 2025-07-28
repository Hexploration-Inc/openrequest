import { useEffect } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useTabsStore } from "../../lib/stores/tabs";
import { CollectionsSidebar } from "../Collections/CollectionsSidebar";
import { RequestBuilder } from "../RequestBuilder";
import { ResponseViewer } from "../ResponseViewer";
import { RequestTabs } from "../RequestTabs";

export function MainLayout() {
  const initializeDatabase = useCollectionsStore((state) => state.initializeDatabase);
  const isDbInitialized = useCollectionsStore((state) => state.isDbInitialized);
  const collections = useCollectionsStore((state) => state.collections);
  const selectedCollectionId = useCollectionsStore((state) => state.selectedCollectionId);
  const { openNewTab, tabs } = useTabsStore();

  useEffect(() => {
    console.log("🏗️ MainLayout: Initializing database...");
    initializeDatabase()
      .then(() => {
        console.log("✅ MainLayout: Database initialized successfully");
        // Open a new tab if no tabs are open
        if (tabs.length === 0) {
          openNewTab();
        }
      })
      .catch((error) => {
        console.error("❌ MainLayout: Database initialization failed:", error);
      });
  }, [initializeDatabase, openNewTab, tabs.length]);

  useEffect(() => {
    console.log("📊 MainLayout: State updated:", {
      isDbInitialized,
      collectionsCount: collections.length,
      selectedCollectionId,
      collections: collections.map(c => ({ id: c.id, name: c.name }))
    });
    
    // Expose store to global scope for debugging
    (window as any).collectionsStore = useCollectionsStore.getState();
  }, [isDbInitialized, collections, selectedCollectionId]);

  if (!isDbInitialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <CollectionsSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Request Tabs */}
        <RequestTabs />
        
        {/* Request Builder - Top Half */}
        <div className="h-1/2 border-b border-gray-200 bg-white">
          <RequestBuilder />
        </div>

        {/* Response Viewer - Bottom Half */}
        <div className="h-1/2 bg-white">
          <ResponseViewer />
        </div>
      </div>
    </div>
  );
}