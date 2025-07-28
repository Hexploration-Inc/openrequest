import { useEffect } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { CollectionsSidebar } from "../Collections/CollectionsSidebar";
import { RequestBuilder } from "../RequestBuilder";
import { ResponseViewer } from "../ResponseViewer";

export function MainLayout() {
  const initializeDatabase = useCollectionsStore((state) => state.initializeDatabase);
  const isDbInitialized = useCollectionsStore((state) => state.isDbInitialized);

  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, [initializeDatabase]);

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
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <CollectionsSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Request Builder - Top Half */}
        <div className="h-1/2 border-b border-gray-200">
          <RequestBuilder />
        </div>

        {/* Response Viewer - Bottom Half */}
        <div className="h-1/2">
          <ResponseViewer />
        </div>
      </div>
    </div>
  );
}