import { useTabsStore } from "../../lib/stores/tabs";
import { X, Plus } from "lucide-react";
import { Button } from "../ui/button";

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, openNewTab } = useTabsStore();

  if (tabs.length === 0) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2">
        <Button
          onClick={openNewTab}
          variant="ghost"
          size="sm"
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center group cursor-pointer border-r border-gray-200 dark:border-gray-700 ${
              activeTabId === tab.id
                ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-b-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <button
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 flex items-center min-w-0 max-w-48"
            >
              <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                {tab.name}
              </span>
              {tab.isUnsaved && (
                <div className="ml-2 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
              )}
            </button>
            
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-1 mr-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <Button
        onClick={openNewTab}
        variant="ghost"
        size="sm"
        className="mx-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}