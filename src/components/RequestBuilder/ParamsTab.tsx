import { useTabsStore } from "../../lib/stores/tabs";
import { KeyValueEditor } from "./KeyValueEditor";

interface ParamsTabProps {
  tabId: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function ParamsTab({ tabId }: ParamsTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) {
    return null;
  }
  
  const addParam = () => {
    const newParam = {
      id: generateId(),
      key: '',
      value: '',
      enabled: true,
    };
    updateTabData(tabId, { 
      params: [...activeTab.params, newParam] 
    });
    markTabAsUnsaved(tabId);
  };
  
  const updateParam = (id: string, key: string, value: string, enabled: boolean) => {
    const updatedParams = activeTab.params.map(param =>
      param.id === id ? { ...param, key, value, enabled } : param
    );
    updateTabData(tabId, { params: updatedParams });
    markTabAsUnsaved(tabId);
  };
  
  const removeParam = (id: string) => {
    if (activeTab.params.length > 1) {
      const updatedParams = activeTab.params.filter(param => param.id !== id);
      updateTabData(tabId, { params: updatedParams });
      markTabAsUnsaved(tabId);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Query Parameters</h3>
            <p className="text-xs text-gray-500 mt-1">
              Parameters will be automatically URL-encoded and appended to the request URL.
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {activeTab.params.filter(p => p.enabled && p.key.trim()).length} active
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 min-h-0">
        <KeyValueEditor
          items={activeTab.params}
          onAdd={addParam}
          onUpdate={updateParam}
          onRemove={removeParam}
          placeholder={{
            key: "Parameter name",
            value: "Parameter value"
          }}
        />
      </div>
    </div>
  );
}