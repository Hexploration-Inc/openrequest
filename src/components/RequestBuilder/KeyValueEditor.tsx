import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, X } from "lucide-react";
import { KeyValuePair, EnvironmentVariable } from "../../lib/types";

type EditableItem = KeyValuePair | EnvironmentVariable;

interface KeyValueEditorProps {
  // Support both interfaces for backwards compatibility
  items?: KeyValuePair[];
  data?: EditableItem[];
  onAdd?: () => void;
  onChange?: (data: EditableItem[]) => void;
  onUpdate?: (id: string, key: string, value: string, enabled: boolean) => void;
  onRemove?: (id: string) => void;
  showEnabled?: boolean;
  placeholder?: {
    key: string;
    value: string;
  };
  renderActions?: (item: EditableItem) => React.ReactNode;
}

export function KeyValueEditor({
  items,
  data,
  onAdd,
  onChange,
  onUpdate,
  onRemove,
  showEnabled = true,
  placeholder = { key: "Key", value: "Value" },
  renderActions,
}: KeyValueEditorProps) {
  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  // Use data prop if available (new interface), otherwise use items (legacy interface)
  const currentData = data || items || [];
  const isNewInterface = Boolean(data && onChange);

  const handleUpdate = (id: string, key: string, value: string, enabled: boolean) => {
    if (isNewInterface && onChange) {
      const updated = currentData.map(item =>
        item.id === id ? { ...item, key, value, enabled } : item
      );
      onChange(updated);
    } else if (onUpdate) {
      onUpdate(id, key, value, enabled);
    }
  };

  const handleRemove = (id: string) => {
    if (isNewInterface && onChange) {
      const updated = currentData.filter(item => item.id !== id);
      onChange(updated);
    } else if (onRemove) {
      onRemove(id);
    }
  };

  const handleAdd = () => {
    if (isNewInterface && onChange) {
      const newItem = {
        id: generateId(),
        key: '',
        value: '',
        enabled: true,
      };
      onChange([...currentData, newItem]);
    } else if (onAdd) {
      onAdd();
    }
  };

  const isSecret = (item: EditableItem): boolean => {
    return 'isSecret' in item ? item.isSecret || false : false;
  };

  const gridCols = renderActions ? 'grid-cols-[32px_1fr_1fr_auto_32px]' : 'grid-cols-[32px_1fr_1fr_32px]';
  const checkboxCols = showEnabled ? '' : 'hidden';

  return (
    <div className="w-full flex flex-col min-h-0">
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-0 border-b border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#2d2d2d]`}>
        {showEnabled && (
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] flex items-center justify-center">
            <input
              type="checkbox"
              className="w-3 h-3 rounded border-gray-300 dark:border-[#404040] dark:bg-[#2d2d2d]"
              checked={currentData.length > 0 && currentData.every(item => item.enabled)}
              onChange={(e) => {
                currentData.forEach(item => {
                  handleUpdate(item.id, item.key, item.value, e.target.checked);
                });
              }}
            />
          </div>
        )}
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] border-l border-gray-200 dark:border-[#404040]">
          Key
        </div>
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] border-l border-gray-200 dark:border-[#404040]">
          Value
        </div>
        {renderActions && (
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] border-l border-gray-200 dark:border-[#404040]">
            Actions
          </div>
        )}
        <div className="px-2 py-1.5 border-l border-gray-200 dark:border-[#404040]"></div>
      </div>

      {/* Table Body */}
      <div className="bg-white dark:bg-[#1f1f1f] flex-1 min-h-0 overflow-y-auto">
        {currentData.map((item) => (
          <div 
            key={item.id} 
            className={`grid ${gridCols} gap-0 border-b border-gray-100 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#383838] group ${
              !item.enabled ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox */}
            {showEnabled && (
              <div className="px-2 py-2 flex items-center justify-center border-r border-gray-100 dark:border-[#404040]">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => handleUpdate(item.id, item.key, item.value, e.target.checked)}
                  className="w-3 h-3 rounded border-gray-300 dark:border-[#404040] text-blue-600 focus:ring-blue-500 dark:bg-[#2d2d2d]"
                />
              </div>
            )}

            {/* Key Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-[#404040] min-w-0">
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={(e) => handleUpdate(item.id, e.target.value, item.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5f6368] dark:text-[#e8eaed] w-full"
              />
            </div>

            {/* Value Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-[#404040] min-w-0">
              <Input
                type={isSecret(item) ? "password" : "text"}
                placeholder={placeholder.value}
                value={item.value}
                onChange={(e) => handleUpdate(item.id, item.key, e.target.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5f6368] dark:text-[#e8eaed] w-full"
              />
            </div>

            {/* Custom Actions */}
            {renderActions && (
              <div className="px-2 py-1 border-r border-gray-100 dark:border-[#404040] flex items-center gap-1">
                {renderActions(item)}
              </div>
            )}

            {/* Delete Button */}
            <div className="px-2 py-2 flex items-center justify-center">
              <button
                onClick={() => handleRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-400 dark:text-[#5f6368] hover:text-gray-600 dark:hover:text-[#9aa0a6] transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Row */}
        <div className={`grid ${gridCols} gap-0 border-b border-gray-100 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#383838]`}>
          {showEnabled && (
            <div className="px-2 py-2 border-r border-gray-100 dark:border-[#404040]"></div>
          )}
          <div className="px-2 py-2 border-r border-gray-100">
            <button
              onClick={handleAdd}
              className="text-xs text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="px-2 py-2 border-r border-gray-100 dark:border-[#404040]"></div>
          {renderActions && (
            <div className="px-2 py-2 border-r border-gray-100 dark:border-[#404040]"></div>
          )}
          <div className="px-2 py-2"></div>
        </div>
      </div>

      {/* Compact Footer */}
      {showEnabled && currentData.filter(item => item.enabled && item.key.trim()).length > 0 && (
        <div className="bg-gray-50 dark:bg-[#2d2d2d] px-3 py-1.5 text-xs text-gray-500 dark:text-[#9aa0a6] border-t border-gray-200 dark:border-[#404040]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  currentData.forEach(item => {
                    handleUpdate(item.id, item.key, item.value, true);
                  });
                }}
                className="text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                All
              </button>
              <button 
                onClick={() => {
                  currentData.forEach(item => {
                    handleUpdate(item.id, item.key, item.value, false);
                  });
                }}
                className="text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                None
              </button>
            </div>
            <div>
              {currentData.filter(item => item.enabled && item.key.trim()).length} enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}