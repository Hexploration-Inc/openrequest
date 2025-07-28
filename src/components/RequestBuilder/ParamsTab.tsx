import { useRequestStore } from "../../lib/stores/request";
import { KeyValueEditor } from "./KeyValueEditor";

export function ParamsTab() {
  const {
    params,
    addParam,
    updateParam,
    removeParam,
  } = useRequestStore();

  return (
    <div className="h-full bg-white">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Query Parameters</h3>
          <p className="text-xs text-gray-600">
            Parameters will be automatically URL-encoded and appended to the request URL.
          </p>
        </div>
        
        <KeyValueEditor
          items={params}
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