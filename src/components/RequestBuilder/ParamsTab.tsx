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
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 p-3 sm:p-6 min-h-0 overflow-y-auto">
        <KeyValueEditor
          items={activeTab.params}
          onAdd={addParam}
          onUpdate={updateParam}
          onRemove={removeParam}
          placeholder={{
            key: "Key",
            value: "Value"
          }}
        />
      </div>
    </div>
  );
}