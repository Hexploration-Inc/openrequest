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
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                The token will be sent as: Authorization: Bearer &lt;token&gt;
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
              />
            </div>
            <p className="text-xs text-gray-500">
              Credentials will be base64 encoded and sent as: Authorization: Basic &lt;encoded&gt;
            </p>
          </div>
        );

      case "api-key":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Key Name
              </label>
              <Input
                placeholder="e.g., X-API-Key, api_key"
                value={activeTab.auth.data.key || ""}
                onChange={(e) => updateAuthData("key", e.target.value)}
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
                className="font-mono"
              />
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
                >
                  Header
                </Button>
                <Button
                  variant={activeTab.auth.data.in === "query" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateAuthData("in", "query")}
                >
                  Query Parameter
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab.auth.data.in === "header"
                  ? "API key will be sent as a request header"
                  : "API key will be sent as a query parameter"}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>No authentication will be used for this request.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Authentication</h3>
          <p className="text-xs text-gray-600">
            Choose how to authenticate this request with the API.
          </p>
        </div>

        {/* Auth Type Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            Authentication Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AUTH_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={activeTab.auth.type === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAuthType(type.value)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Auth Configuration Form */}
        <Card>
          <CardContent className="p-4">
            {renderAuthForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}