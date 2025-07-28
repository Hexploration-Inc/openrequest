import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Trash2, Plus } from "lucide-react";
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
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 px-2">
        <div className="col-span-1"></div>
        <div className="col-span-5">{placeholder.key}</div>
        <div className="col-span-5">{placeholder.value}</div>
        <div className="col-span-1"></div>
      </div>

      {/* Key-Value Pairs */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
            {/* Enabled Checkbox */}
            <div className="col-span-1 flex justify-center">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onUpdate(item.id, item.key, item.value, e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
            </div>

            {/* Key Input */}
            <div className="col-span-5">
              <Input
                placeholder={placeholder.key}
                value={item.key}
                onChange={(e) => onUpdate(item.id, e.target.value, item.value, item.enabled)}
                className="h-8 text-sm"
              />
            </div>

            {/* Value Input */}
            <div className="col-span-5">
              <Input
                placeholder={placeholder.value}
                value={item.value}
                onChange={(e) => onUpdate(item.id, item.key, e.target.value, item.enabled)}
                className="h-8 text-sm"
              />
            </div>

            {/* Delete Button */}
            <div className="col-span-1 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                disabled={items.length === 1}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Row
        </Button>
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-500 pt-2">
        {items.filter(item => item.enabled && item.key.trim()).length} enabled, {items.length} total
      </div>
    </div>
  );
}