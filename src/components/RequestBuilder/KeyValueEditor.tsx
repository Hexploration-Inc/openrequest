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
      <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-0 border-b border-gray-200 bg-gray-50">
        <div className="px-2 sm:px-3 py-2 text-xs font-medium text-gray-600 flex items-center justify-center">
          <input
            type="checkbox"
            className="w-3 h-3 rounded border-gray-300"
            checked={items.length > 0 && items.every(item => item.enabled)}
            onChange={(e) => {
              items.forEach(item => {
                onUpdate(item.id, item.key, item.value, e.target.checked);
              });
            }}
          />
        </div>
        <div className="px-2 sm:px-3 py-2 text-xs font-medium text-gray-600 border-l border-gray-200">
          KEY
        </div>
        <div className="px-2 sm:px-3 py-2 text-xs font-medium text-gray-600 border-l border-gray-200">
          VALUE
        </div>
        <div className="px-2 sm:px-3 py-2 border-l border-gray-200"></div>
      </div>

      {/* Table Body */}
      <div className="bg-white flex-1 min-h-0 overflow-y-auto">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`grid grid-cols-[40px_1fr_1fr_40px] gap-0 border-b border-gray-100 hover:bg-gray-50 group ${
              !item.enabled ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="px-2 sm:px-3 py-3 flex items-center justify-center border-r border-gray-100">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onUpdate(item.id, item.key, item.value, e.target.checked)}
                className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Key Input */}
            <div className="px-1 sm:px-3 py-1 border-r border-gray-100 min-w-0">
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={(e) => onUpdate(item.id, e.target.value, item.value, item.enabled)}
                className="h-8 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 font-mono w-full"
              />
            </div>

            {/* Value Input */}
            <div className="px-1 sm:px-3 py-1 border-r border-gray-100 min-w-0">
              <Input
                placeholder={placeholder.value}
                value={item.value}
                onChange={(e) => onUpdate(item.id, item.key, e.target.value, item.enabled)}
                className="h-8 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-gray-400 font-mono w-full"
              />
            </div>

            {/* Delete Button */}
            <div className="px-2 sm:px-3 py-3 flex items-center justify-center">
              <button
                onClick={() => onRemove(item.id)}
                disabled={items.length === 1}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-0 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Row */}
        <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-0 border-b border-gray-100">
          <div className="px-3 py-3 border-r border-gray-100"></div>
          <div className="px-3 py-3 border-r border-gray-100">
            <button
              onClick={onAdd}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Add new
            </button>
          </div>
          <div className="px-3 py-3 border-r border-gray-100"></div>
          <div className="px-3 py-3"></div>
        </div>
      </div>

      {/* Bulk Actions Footer */}
      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 flex items-center justify-between border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              items.forEach(item => {
                onUpdate(item.id, item.key, item.value, true);
              });
            }}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Select All
          </button>
          <button 
            onClick={() => {
              items.forEach(item => {
                onUpdate(item.id, item.key, item.value, false);
              });
            }}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Deselect All
          </button>
        </div>
        <div>
          {items.filter(item => item.enabled && item.key.trim()).length} / {items.length}
        </div>
      </div>
    </div>
  );
}