import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, X } from "lucide-react";
import { KeyValuePair } from "../../lib/types";

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onAdd: () => void;
  onUpdate: (id: string, key: string, value: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
  placeholder?: {
    key: string;
    value: string;
  };
}

export function KeyValueEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  placeholder = { key: "Key", value: "Value" }
}: KeyValueEditorProps) {
  return (
    <div className="w-full flex flex-col min-h-0">
      {/* Table Header */}
      <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-200 dark:border-[#404040] bg-gray-50 dark:bg-[#2d2d2d]">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] flex items-center justify-center">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-gray-300 dark:border-[#404040] dark:bg-[#2d2d2d]"
            checked={items.length > 0 && items.every(item => item.enabled)}
            onChange={(e) => {
              items.forEach(item => {
                onUpdate(item.id, item.key, item.value, e.target.checked);
              });
            }}
          />
        </div>
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] border-l border-gray-200 dark:border-[#404040]">
          Key
        </div>
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-[#9aa0a6] border-l border-gray-200 dark:border-[#404040]">
          Value
        </div>
        <div className="px-2 py-1.5 border-l border-gray-200 dark:border-[#404040]"></div>
      </div>

      {/* Table Body */}
      <div className="bg-white dark:bg-[#1f1f1f] flex-1 min-h-0 overflow-y-auto">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-100 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#383838] group ${
              !item.enabled ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="px-2 py-2 flex items-center justify-center border-r border-gray-100 dark:border-[#404040]">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onUpdate(item.id, item.key, item.value, e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 dark:border-[#404040] text-blue-600 focus:ring-blue-500 dark:bg-[#2d2d2d]"
              />
            </div>

            {/* Key Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-[#404040] min-w-0">
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={(e) => onUpdate(item.id, e.target.value, item.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5f6368] dark:text-[#e8eaed] w-full"
              />
            </div>

            {/* Value Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-[#404040] min-w-0">
              <Input
                placeholder={placeholder.value}
                value={item.value}
                onChange={(e) => onUpdate(item.id, item.key, e.target.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#5f6368] dark:text-[#e8eaed] w-full"
              />
            </div>

            {/* Delete Button */}
            <div className="px-2 py-2 flex items-center justify-center">
              <button
                onClick={() => onRemove(item.id)}
                disabled={items.length === 1}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-400 dark:text-[#5f6368] hover:text-gray-600 dark:hover:text-[#9aa0a6] transition-all disabled:opacity-0 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Row */}
        <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-100 dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#383838]">
          <div className="px-2 py-2 border-r border-gray-100 dark:border-[#404040]"></div>
          <div className="px-2 py-2 border-r border-gray-100">
            <button
              onClick={onAdd}
              className="text-xs text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="px-2 py-2 border-r border-gray-100 dark:border-[#404040]"></div>
          <div className="px-2 py-2"></div>
        </div>
      </div>

      {/* Compact Footer */}
      {items.filter(item => item.enabled && item.key.trim()).length > 0 && (
        <div className="bg-gray-50 dark:bg-[#2d2d2d] px-3 py-1.5 text-xs text-gray-500 dark:text-[#9aa0a6] border-t border-gray-200 dark:border-[#404040]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  items.forEach(item => {
                    onUpdate(item.id, item.key, item.value, true);
                  });
                }}
                className="text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                All
              </button>
              <button 
                onClick={() => {
                  items.forEach(item => {
                    onUpdate(item.id, item.key, item.value, false);
                  });
                }}
                className="text-gray-500 dark:text-[#9aa0a6] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                None
              </button>
            </div>
            <div>
              {items.filter(item => item.enabled && item.key.trim()).length} enabled
            </div>
          </div>
        </div>
      )}
    </div>
  );
}