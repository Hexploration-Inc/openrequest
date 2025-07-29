import { useTabsStore } from "../../lib/stores/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { AuthConfig } from "../../lib/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const AUTH_TYPES = [
  { value: "none", label: "No Auth" },
  { value: "bearer", label: "Bearer Token" },
  { value: "basic", label: "Basic Auth" },
  { value: "api-key", label: "API Key" },
] as const;

interface AuthTabProps {
  tabId: string;
}

export function AuthTab({ tabId }: AuthTabProps) {
  const { getActiveTab, updateTabData, markTabAsUnsaved } = useTabsStore();
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  
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
      data: type === 'api-key' ? { in: 'header' } : {},
    };
    updateTabData(tabId, { auth: updatedAuth });
    markTabAsUnsaved(tabId);
    setShowAuthDropdown(false);
  };

  const currentAuthType = AUTH_TYPES.find(type => type.value === activeTab.auth.type);

  const renderAuthForm = () => {
    switch (activeTab.auth.type) {
      case "bearer":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token
              </label>
              <Input
                placeholder="Enter your bearer token"
                value={activeTab.auth.data.token || ""}
                onChange={(e) => updateAuthData("token", e.target.value)}
                className="font-mono bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
              />
            </div>
          </div>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <Input
                  placeholder="Username"
                  value={activeTab.auth.data.username || ""}
                  onChange={(e) => updateAuthData("username", e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={activeTab.auth.data.password || ""}
                  onChange={(e) => updateAuthData("password", e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        );

      case "api-key":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key
                </label>
                <Input
                  placeholder="X-API-Key"
                  value={activeTab.auth.data.key || ""}
                  onChange={(e) => updateAuthData("key", e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Value
                </label>
                <Input
                  placeholder="Enter your API key"
                  value={activeTab.auth.data.value || ""}
                  onChange={(e) => updateAuthData("value", e.target.value)}
                  className="font-mono bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add to
                </label>
                <Select
                  value={activeTab.auth.data.in || "header"}
                  onValueChange={(value) => updateAuthData("in", value)}
                  options={[
                    { value: "header", label: "Header" },
                    { value: "query", label: "Query Params" }
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-sm">This request is not using any authorization.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
      {/* Auth Type Selection - Compact */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
          
          {/* Auth Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:border-blue-500 focus:ring-blue-500 min-w-[140px] justify-between dark:text-gray-200"
            >
              <span>{currentAuthType?.label || "No Auth"}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {showAuthDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[140px]">
                {AUTH_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAuthType(type.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                      activeTab.auth.type === type.value ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Configuration Form - Compact */}
      <div className="flex-1 p-4 min-h-0 overflow-y-auto">
        {renderAuthForm()}
      </div>

      {/* Click outside to close dropdown */}
      {showAuthDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowAuthDropdown(false)}
        />
      )}
    </div>
  );
}