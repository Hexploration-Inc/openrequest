import { useTabsStore } from "../../lib/stores/tabs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { BodyType } from "../../lib/types";

const BODY_TYPES: { value: BodyType; label: string; description: string }[] = [
  { value: "none", label: "None", description: "No request body" },
  { value: "json", label: "JSON", description: "application/json" },
  { value: "xml", label: "XML", description: "application/xml" },
  { value: "html", label: "HTML", description: "text/html" },
  { value: "text", label: "Text", description: "text/plain" },
  { value: "javascript", label: "JavaScript", description: "application/javascript" },
  { value: "form-data", label: "Form Data", description: "multipart/form-data" },
  { value: "x-www-form-urlencoded", label: "URL Encoded", description: "application/x-www-form-urlencoded" },
];

interface BodyTabProps {
  tabId: string;
}

export function BodyTab({ tabId }: BodyTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) {
    return null;
  }

  const handleFormatCode = () => {
    if (activeTab.bodyType === "json") {
      try {
        const formatted = JSON.stringify(JSON.parse(activeTab.bodyContent), null, 2);
        updateTabData(tabId, { bodyContent: formatted });
        markTabAsUnsaved(tabId);
      } catch (e) {
        // Invalid JSON, do nothing
      }
    }
  };

  const getPlaceholder = () => {
    switch (activeTab.bodyType) {
      case "json":
        return '{\n  "key": "value",\n  "number": 123,\n  "boolean": true\n}';
      case "xml":
        return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <element>value</element>\n</root>';
      case "html":
        return '<!DOCTYPE html>\n<html>\n<head>\n  <title>Title</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>';
      case "javascript":
        return 'const data = {\n  message: "Hello World"\n};\n\nconsole.log(data);';
      case "form-data":
        return "Use the form below to add key-value pairs for multipart/form-data";
      case "x-www-form-urlencoded":
        return "key1=value1&key2=value2&key3=value3";
      default:
        return "Enter your request body here...";
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Request Body</h3>
            <p className="text-xs text-gray-500 mt-1">
              The request body contains the data sent to the server.
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {activeTab.bodyType !== 'none' && activeTab.bodyContent ? 
              `${new Blob([activeTab.bodyContent]).size} bytes` : 
              'No body'
            }
          </div>
        </div>

        {/* Body Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-3 block">Body Type</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {BODY_TYPES.slice(0, 4).map((type) => (
              <Button
                key={type.value}
                variant={activeTab.bodyType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  updateTabData(tabId, { bodyType: type.value });
                  markTabAsUnsaved(tabId);
                }}
                className={`justify-center h-8 text-xs ${
                  activeTab.bodyType === type.value 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                }`}
              >
                {type.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {BODY_TYPES.slice(4).map((type) => (
              <Button
                key={type.value}
                variant={activeTab.bodyType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  updateTabData(tabId, { bodyType: type.value });
                  markTabAsUnsaved(tabId);
                }}
                className={`justify-center h-8 text-xs ${
                  activeTab.bodyType === type.value 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                }`}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-6 min-h-0">
        {activeTab.bodyType === "none" ? (
          <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center">
              <div className="text-lg mb-2">📝</div>
              <p className="text-sm">No body content for this request</p>
              <p className="text-xs mt-1">Select a body type above to add content</p>
            </div>
          </div>
        ) : activeTab.bodyType === "form-data" ? (
          <div className="h-full flex flex-col">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-800 text-sm">
                  <strong>Coming Soon:</strong> Visual form-data editor. Use raw multipart format for now.
                </div>
              </div>
            </div>
            <Textarea
              placeholder="For now, use raw multipart format or switch to JSON/URL Encoded"
              value={activeTab.bodyContent}
              onChange={(e) => {
                updateTabData(tabId, { bodyContent: e.target.value });
                markTabAsUnsaved(tabId);
              }}
              className="flex-1 font-mono text-sm resize-none border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {/* Format Button for JSON */}
                {activeTab.bodyType === "json" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatCode}
                    className="h-7 text-xs hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                  >
                    Format JSON
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {activeTab.bodyContent ? `${activeTab.bodyContent.split('\n').length} lines` : '0 lines'}
              </div>
            </div>
            
            <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
              <Textarea
                placeholder={getPlaceholder()}
                value={activeTab.bodyContent}
                onChange={(e) => {
                  updateTabData(tabId, { bodyContent: e.target.value });
                  markTabAsUnsaved(tabId);
                }}
                className="h-full w-full font-mono text-sm resize-none border-0 focus:ring-0 focus:outline-orange-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}