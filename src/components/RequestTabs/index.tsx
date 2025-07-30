import { useTabsStore } from "../../lib/stores/tabs";
import { X, Plus } from "lucide-react";
import { Button } from "../ui/button";

export function RequestTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, openNewTab } = useTabsStore();

  if (tabs.length === 0) {
    return (
      <div className="border-b border-gray-200 dark:border-[#404040] bg-white dark:bg-[#1f1f1f] px-4 py-2">
        <Button
          onClick={openNewTab}
          variant="ghost"
          size="sm"
          className="text-gray-600 dark:text-[#9aa0a6] hover:text-gray-900 dark:hover:text-[#e8eaed]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-[#404040] bg-white dark:bg-[#1f1f1f] flex items-center">
      <div className="flex-1 flex items-center overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center group cursor-pointer border-r border-gray-200 dark:border-[#404040] ${
              activeTabId === tab.id
                ? 'bg-blue-50 dark:bg-blue-900 border-b-2 border-b-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-[#383838]'
            }`}
          >
            <button
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 flex items-center min-w-0 max-w-48"
            >
              <span className="truncate text-sm font-medium text-gray-700 dark:text-[#9aa0a6]">
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
                className="p-1 mr-2 rounded hover:bg-gray-200 dark:hover:bg-[#383838] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-gray-500 dark:text-[#9aa0a6]" />
              </button>
            )}
          </div>
        ))}
      </div>
      
      <Button
        onClick={openNewTab}
        variant="ghost"
        size="sm"
        className="mx-2 text-gray-600 dark:text-[#9aa0a6] hover:text-gray-900 dark:hover:text-[#e8eaed] flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}