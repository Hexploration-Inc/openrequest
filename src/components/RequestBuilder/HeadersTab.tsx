import { useRequestStore } from "../../lib/stores/request";
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

export function HeadersTab() {
  const {
    headers,
    addHeader,
    updateHeader,
    removeHeader,
  } = useRequestStore();

  const addCommonHeader = (headerTemplate: { key: string; value: string }) => {
    // Find an empty header to populate or add a new one
    const emptyHeader = headers.find(h => !h.key.trim() && !h.value.trim());
    if (emptyHeader) {
      updateHeader(emptyHeader.id, headerTemplate.key, headerTemplate.value, true);
    } else {
      addHeader();
      // Update the newly added header (it will be the last one)
      const newHeader = headers[headers.length - 1];
      if (newHeader) {
        setTimeout(() => {
          updateHeader(newHeader.id, headerTemplate.key, headerTemplate.value, true);
        }, 0);
      }
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Request Headers</h3>
          <p className="text-xs text-gray-600">
            Headers allow you to provide additional information about the request.
          </p>
        </div>

        {/* Common Headers Quick Add */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Quick Add Common Headers</h4>
          <div className="flex flex-wrap gap-2">
            {COMMON_HEADERS.map((header) => (
              <Button
                key={header.key}
                variant="outline"
                size="sm"
                onClick={() => addCommonHeader(header)}
                className="h-7 text-xs px-3 bg-white hover:bg-gray-100"
              >
                {header.key}
              </Button>
            ))}
          </div>
        </div>
        
        <KeyValueEditor
          items={headers}
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