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
      <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            checked={items.length > 0 && items.every(item => item.enabled)}
            onChange={(e) => {
              items.forEach(item => {
                onUpdate(item.id, item.key, item.value, e.target.checked);
              });
            }}
          />
        </div>
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
          Key
        </div>
        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
          Value
        </div>
        <div className="px-2 py-1.5 border-l border-gray-200 dark:border-gray-700"></div>
      </div>

      {/* Table Body */}
      <div className="bg-white dark:bg-gray-800 flex-1 min-h-0 overflow-y-auto">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 group ${
              !item.enabled ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="px-2 py-2 flex items-center justify-center border-r border-gray-100 dark:border-gray-700">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onUpdate(item.id, item.key, item.value, e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>

            {/* Key Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-gray-700 min-w-0">
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={(e) => onUpdate(item.id, e.target.value, item.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-100 w-full"
              />
            </div>

            {/* Value Input */}
            <div className="px-2 py-1 border-r border-gray-100 dark:border-gray-700 min-w-0">
              <Input
                placeholder={placeholder.value}
                value={item.value}
                onChange={(e) => onUpdate(item.id, item.key, e.target.value, item.enabled)}
                className="h-7 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-100 w-full"
              />
            </div>

            {/* Delete Button */}
            <div className="px-2 py-2 flex items-center justify-center">
              <button
                onClick={() => onRemove(item.id)}
                disabled={items.length === 1}
                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-0 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Row */}
        <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-0 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="px-2 py-2 border-r border-gray-100 dark:border-gray-700"></div>
          <div className="px-2 py-2 border-r border-gray-100">
            <button
              onClick={onAdd}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              + Add
            </button>
          </div>
          <div className="px-2 py-2 border-r border-gray-100 dark:border-gray-700"></div>
          <div className="px-2 py-2"></div>
        </div>
      </div>

      {/* Compact Footer */}
      {items.filter(item => item.enabled && item.key.trim()).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  items.forEach(item => {
                    onUpdate(item.id, item.key, item.value, true);
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                All
              </button>
              <button 
                onClick={() => {
                  items.forEach(item => {
                    onUpdate(item.id, item.key, item.value, false);
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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