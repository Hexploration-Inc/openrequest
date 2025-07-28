import { useTabsStore } from "../../lib/stores/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { AuthConfig } from "../../lib/types";

const AUTH_TYPES = [
  { value: "none", label: "No Auth", description: "No authentication required" },
  { value: "bearer", label: "Bearer Token", description: "Authorization: Bearer <token>" },
  { value: "basic", label: "Basic Auth", description: "Username and password" },
  { value: "api-key", label: "API Key", description: "Custom API key in header or query" },
] as const;

interface AuthTabProps {
  tabId: string;
}

export function AuthTab({ tabId }: AuthTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  
  const activeTab = getActiveTab();
  if (!activeTab || activeTab.id !== tabId) {
    return null;
  }

  const updateAuthData = (key: string, value: string) => {
    const updatedAuth = {
      ...activeTab.auth,
      data: {
        ...activeTab.auth.data,
        [key]: value,
      },
    };
    updateTabData(tabId, { auth: updatedAuth });
    markTabAsUnsaved(tabId);
  };

  const setAuthType = (type: AuthConfig['type']) => {
    const updatedAuth = {
      type,
      data: {},
    };
    updateTabData(tabId, { auth: updatedAuth });
    markTabAsUnsaved(tabId);
  };

  const renderAuthForm = () => {
    switch (activeTab.auth.type) {
      case "bearer":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Bearer Token
              </label>
              <Input
                placeholder="Enter your bearer token"
                value={activeTab.auth.data.token || ""}
                onChange={(e) => updateAuthData("token", e.target.value)}
                className="font-mono bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The token will be sent as: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
              </p>
            </div>
          </div>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Username
              </label>
              <Input
                placeholder="Enter username"
                value={activeTab.auth.data.username || ""}
                onChange={(e) => updateAuthData("username", e.target.value)}
                className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter password"
                value={activeTab.auth.data.password || ""}
                onChange={(e) => updateAuthData("password", e.target.value)}
                className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Credentials will be base64 encoded and sent as: <code className="bg-gray-100 px-1 rounded">Authorization: Basic &lt;encoded&gt;</code>
            </p>
          </div>
        );

      case "api-key":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Key Name
                </label>
                <Input
                  placeholder="e.g., X-API-Key, api_key"
                  value={activeTab.auth.data.key || ""}
                  onChange={(e) => updateAuthData("key", e.target.value)}
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Key Value
                </label>
                <Input
                  placeholder="Enter your API key"
                  value={activeTab.auth.data.value || ""}
                  onChange={(e) => updateAuthData("value", e.target.value)}
                  className="font-mono bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Add To
              </label>
              <div className="flex gap-2">
                <Button
                  variant={activeTab.auth.data.in === "header" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateAuthData("in", "header")}
                  className={activeTab.auth.data.in === "header" 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                  }
                >
                  Header
                </Button>
                <Button
                  variant={activeTab.auth.data.in === "query" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateAuthData("in", "query")}
                  className={activeTab.auth.data.in === "query" 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                  }
                >
                  Query Parameter
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {activeTab.auth.data.in === "header"
                  ? "API key will be sent as a request header"
                  : "API key will be sent as a query parameter"}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-400">
            <div className="text-2xl mb-2">🔓</div>
            <p className="text-sm">No authentication will be used for this request.</p>
            <p className="text-xs mt-1">Select an authentication type above to configure credentials.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Authentication</h3>
            <p className="text-xs text-gray-500 mt-1">
              Choose how to authenticate this request with the API.
            </p>
          </div>
          <div className="text-xs text-gray-500">
            {activeTab.auth.type !== 'none' ? 
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                ✓ {AUTH_TYPES.find(t => t.value === activeTab.auth.type)?.label}
              </span> : 
              <span className="text-gray-400">No auth</span>
            }
          </div>
        </div>

        {/* Auth Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-3 block">
            Authentication Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AUTH_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={activeTab.auth.type === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAuthType(type.value)}
                className={`justify-start h-auto p-3 ${
                  activeTab.auth.type === type.value 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                    : 'hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className={`text-xs ${
                    activeTab.auth.type === type.value ? 'text-orange-100' : 'text-gray-500'
                  }`}>{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Configuration Form */}
      <div className="flex-1 p-6 min-h-0">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-full overflow-y-auto">
          {renderAuthForm()}
        </div>
      </div>
    </div>
  );
}