import { useTabsStore } from "../../lib/stores/tabs";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { BodyType } from "../../lib/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Text content types for the dropdown
const TEXT_TYPES = [
  { value: "text", label: "Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "xml", label: "XML" },
];

interface BodyTabProps {
  tabId: string;
}

export function BodyTab({ tabId }: BodyTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  const [showTextDropdown, setShowTextDropdown] = useState(false);
  
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) {
    return null;
  }

  const handleBodyTypeChange = (type: BodyType) => {
    updateTabData(tabId, { bodyType: type });
    markTabAsUnsaved(tabId);
    setShowTextDropdown(false);
  };

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
      case "text":
        return "Enter your text content here...";
      default:
        return "Enter your request body here...";
    }
  };

  const isTextType = ["text", "javascript", "json", "html", "xml"].includes(activeTab.bodyType);

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Body Type Selection - Compact */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          {/* None */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              checked={activeTab.bodyType === "none"}
              onChange={() => handleBodyTypeChange("none")}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">none</span>
          </label>

          {/* Form Data */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              checked={activeTab.bodyType === "form-data"}
              onChange={() => handleBodyTypeChange("form-data")}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">form-data</span>
          </label>

          {/* URL Encoded */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              checked={activeTab.bodyType === "x-www-form-urlencoded"}
              onChange={() => handleBodyTypeChange("x-www-form-urlencoded")}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">x-www-form-urlencoded</span>
          </label>

          {/* Raw */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              checked={isTextType}
              onChange={() => {
                if (!isTextType) {
                  handleBodyTypeChange("text");
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">raw</span>
          </label>

          {/* Binary */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              checked={activeTab.bodyType === "binary"}
              onChange={() => handleBodyTypeChange("binary" as BodyType)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">binary</span>
          </label>

          {/* Text Type Dropdown - positioned on the right */}
          {isTextType && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowTextDropdown(!showTextDropdown)}
                className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-colors"
              >
                {TEXT_TYPES.find(t => t.value === activeTab.bodyType)?.label || "Text"}
                <ChevronDown className="w-3 h-3" />
              </button>

              {showTextDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[120px]">
                  {TEXT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleBodyTypeChange(type.value as BodyType)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                        activeTab.bodyType === type.value ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body Content Area - Compact */}
      <div className="flex-1 p-4 min-h-0 overflow-y-auto">
        {activeTab.bodyType === "none" ? (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">This request does not have a body</p>
          </div>
        ) : activeTab.bodyType === "form-data" ? (
          <div className="h-full">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Coming Soon:</strong> Visual form-data editor. Use raw format for now.
              </div>
            </div>
            <Textarea
              placeholder="For now, use raw multipart format"
              value={activeTab.bodyContent}
              onChange={(e) => {
                updateTabData(tabId, { bodyContent: e.target.value });
                markTabAsUnsaved(tabId);
              }}
              className="flex-1 h-64 font-mono text-sm resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        ) : activeTab.bodyType === "x-www-form-urlencoded" ? (
          <div className="h-full">
            <Textarea
              placeholder="key1=value1&key2=value2&key3=value3"
              value={activeTab.bodyContent}
              onChange={(e) => {
                updateTabData(tabId, { bodyContent: e.target.value });
                markTabAsUnsaved(tabId);
              }}
              className="w-full h-64 font-mono text-sm resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        ) : activeTab.bodyType === "binary" ? (
          <div className="h-full">
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                <strong>Binary files:</strong> Select a file to upload as the request body.
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <p className="text-sm mb-2">Click to select a file or drag and drop</p>
                <input
                  type="file"
                  className="hidden"
                  id="binary-file-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, just store the file name as content
                      updateTabData(tabId, { bodyContent: `[Binary file: ${file.name}]` });
                      markTabAsUnsaved(tabId);
                    }
                  }}
                />
                <label
                  htmlFor="binary-file-input"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm rounded cursor-pointer transition-colors"
                >
                  Select File
                </label>
                {activeTab.bodyContent && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{activeTab.bodyContent}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {activeTab.bodyType === "json" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFormatCode}
                    className="h-7 text-xs hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Beautify
                  </Button>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Line: 1
                </span>
              </div>
            </div>
            
            {/* Text Editor */}
            <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <Textarea
                placeholder={getPlaceholder()}
                value={activeTab.bodyContent}
                onChange={(e) => {
                  updateTabData(tabId, { bodyContent: e.target.value });
                  markTabAsUnsaved(tabId);
                }}
                className="h-full w-full font-mono text-sm resize-none border-0 focus:ring-0 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showTextDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowTextDropdown(false)}
        />
      )}
    </div>
  );
}