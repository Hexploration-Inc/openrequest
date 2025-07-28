import { useRequestStore } from "../../lib/stores/request";
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

export function BodyTab() {
  const {
    bodyType,
    bodyContent,
    setBodyType,
    setBodyContent,
  } = useRequestStore();

  const handleFormatCode = () => {
    if (bodyType === "json") {
      try {
        const formatted = JSON.stringify(JSON.parse(bodyContent), null, 2);
        setBodyContent(formatted);
      } catch (e) {
        // Invalid JSON, do nothing
      }
    }
  };

  const getPlaceholder = () => {
    switch (bodyType) {
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
      <div className="p-6 space-y-4 flex-shrink-0 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Request Body</h3>
          <p className="text-xs text-gray-600">
            The request body contains the data sent to the server.
          </p>
        </div>

        {/* Body Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Body Type</label>
          <div className="grid grid-cols-2 gap-2">
            {BODY_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={bodyType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setBodyType(type.value)}
                className="justify-start h-auto p-2"
              >
                <div className="text-left">
                  <div className="text-xs font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-6 pt-4">
        {bodyType === "none" ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>No body content for this request</p>
          </div>
        ) : bodyType === "form-data" ? (
          <div className="h-full">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Form data support coming soon. Use raw body for now.
                </div>
              </div>
            </div>
            <Textarea
              placeholder="For now, use raw multipart format or switch to JSON/URL Encoded"
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              className="h-32 font-mono text-sm"
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Format Button for JSON */}
            {bodyType === "json" && (
              <div className="mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFormatCode}
                  className="h-7 text-xs"
                >
                  Format JSON
                </Button>
              </div>
            )}
            
            <Textarea
              placeholder={getPlaceholder()}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              className="flex-1 font-mono text-sm resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}