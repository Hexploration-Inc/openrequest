import { useTabsStore } from "../../lib/stores/tabs";
import { KeyValueEditor } from "./KeyValueEditor";
import { Button } from "../ui/button";

const COMMON_HEADERS = [
  { key: "Accept", value: "application/json" },
  { key: "Content-Type", value: "application/json" },
  { key: "Authorization", value: "Bearer " },
  { key: "User-Agent", value: "OpenRequest/1.0" },
  { key: "Accept-Encoding", value: "gzip, deflate" },
  { key: "Cache-Control", value: "no-cache" },
];

interface HeadersTabProps {
  tabId: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function HeadersTab({ tabId }: HeadersTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) {
    return null;
  }
  
  const addHeader = () => {
    const newHeader = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true,
    };
    updateTabData(tabId, { 
      headers: [...activeTab.headers, newHeader] 
    });
    markTabAsUnsaved(tabId);
  };
  
  const updateHeader = (id: string, key: string, value: string, enabled: boolean) => {
    const updatedHeaders = activeTab.headers.map(header =>
      header.id === id ? { ...header, key, value, enabled } : header
    );
    updateTabData(tabId, { headers: updatedHeaders });
    markTabAsUnsaved(tabId);
  };
  
  const removeHeader = (id: string) => {
    if (activeTab.headers.length > 1) {
      const updatedHeaders = activeTab.headers.filter(header => header.id !== id);
      updateTabData(tabId, { headers: updatedHeaders });
      markTabAsUnsaved(tabId);
    }
  };

  const addCommonHeader = (headerTemplate: { key: string; value: string }) => {
    // Find an empty header to populate or add a new one
    const emptyHeader = activeTab.headers.find(h => !h.key.trim() && !h.value.trim());
    if (emptyHeader) {
      updateHeader(emptyHeader.id, headerTemplate.key, headerTemplate.value, true);
    } else {
      const newHeader = {
        id: generateId(),
        key: headerTemplate.key,
        value: headerTemplate.value,
        enabled: true,
      };
      updateTabData(tabId, { 
        headers: [...activeTab.headers, newHeader] 
      });
      markTabAsUnsaved(tabId);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-[#1f1f1f] flex flex-col overflow-hidden">
      {/* Quick Add Headers - Compact */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100 dark:border-[#404040] bg-gray-50 dark:bg-[#2d2d2d]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-[#9aa0a6]">Quick Add</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {COMMON_HEADERS.map((header) => (
            <Button
              key={header.key}
              variant="outline"
              size="sm"
              onClick={() => addCommonHeader(header)}
              className="h-5 text-xs px-1.5 bg-white dark:bg-[#383838] hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300 border-gray-300 dark:border-[#404040] dark:text-[#e8eaed]"
            >
              {header.key}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Headers Table - Compact */}
      <div className="flex-1 p-4 min-h-0 overflow-y-auto">
        <KeyValueEditor
          items={activeTab.headers}
          onAdd={addHeader}
          onUpdate={updateHeader}
          onRemove={removeHeader}
          placeholder={{
            key: "Header name",
            value: "Header value"
          }}
        />
      </div>
    </div>
  );
}