import { useEffect, useState } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useTabsStore } from "../../lib/stores/tabs";
import { useUIStore } from "../../lib/stores/ui";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "../../lib/hooks/useKeyboardShortcuts";
import { CollectionsSidebar } from "../Collections/CollectionsSidebar";
import { RequestBuilder } from "../RequestBuilder";
import { ResponseViewer } from "../ResponseViewer";
import { RequestTabs } from "../RequestTabs";
import { HistoryPanel } from "../History/HistoryPanel";
import { Menu, X, PanelLeftClose, PanelLeftOpen, Clock } from "lucide-react";
import { Button } from "../ui/button";

export function MainLayout() {
  const initializeDatabase = useCollectionsStore((state) => state.initializeDatabase);
  const isDbInitialized = useCollectionsStore((state) => state.isDbInitialized);
  const collections = useCollectionsStore((state) => state.collections);
  const selectedCollectionId = useCollectionsStore((state) => state.selectedCollectionId);
  const { openNewTab, tabs, closeTab, getActiveTab } = useTabsStore();
  const { sidebarCollapsed, sidebarWidth, toggleSidebar, setSidebarCollapsed } = useUIStore();
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...KEYBOARD_SHORTCUTS.NEW_REQUEST,
      action: () => openNewTab(),
    },
    {
      ...KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR,
      action: () => toggleSidebar(),
    },
    {
      ...KEYBOARD_SHORTCUTS.CLOSE_TAB,
      action: () => {
        const activeTab = getActiveTab();
        if (activeTab) closeTab(activeTab.id);
      },
    },
  ]);

  // Handle responsive sidebar on window resize
  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
      if (!isLarge) {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

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
    <div className="h-screen flex bg-gray-50">
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          ${sidebarCollapsed ? 'w-0 lg:w-16' : `w-${Math.floor(sidebarWidth/4)*4} lg:w-80`}
          ${sidebarCollapsed ? 'lg:translate-x-0 -translate-x-full' : 'translate-x-0'}
          fixed lg:relative top-0 left-0 h-full
          bg-white border-r border-gray-200 flex flex-col shadow-lg lg:shadow-sm
          transition-all duration-300 ease-in-out z-50
        `}
        style={{ width: sidebarCollapsed ? (isLargeScreen ? '64px' : '0px') : `${sidebarWidth}px` }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <span className="font-semibold text-gray-900">OpenRequest</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          <CollectionsSidebar collapsed={sidebarCollapsed} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm" />
            </div>
            <span className="font-semibold text-gray-900">OpenRequest</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="h-8 w-8 p-0"
              title="Request History"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Request Tabs */}
        <div className="bg-white border-b border-gray-200 flex justify-between items-center">
          <div className="flex-1">
            <RequestTabs />
          </div>
          <div className="hidden lg:flex items-center pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="h-8 px-3 text-gray-600 hover:text-gray-900"
            >
              <Clock className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Request Builder */}
          <div className="flex-1 min-h-0 border-b border-gray-200 bg-white">
            <RequestBuilder />
          </div>

          {/* Response Viewer */}
          <div className="flex-1 min-h-0 bg-white">
            <ResponseViewer />
          </div>
        </div>
      </div>

      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}