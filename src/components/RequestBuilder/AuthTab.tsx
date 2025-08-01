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
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "oauth1", label: "OAuth 1.0" },
  { value: "digest", label: "Digest Auth" },
  { value: "aws-signature", label: "AWS Signature" },
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
              <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                Token
              </label>
              <Input
                placeholder="Enter your bearer token"
                value={activeTab.auth.data.token || ""}
                onChange={(e) => updateAuthData("token", e.target.value)}
                className="font-mono bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
              />
            </div>
          </div>
        );

      case "basic":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Username
                </label>
                <Input
                  placeholder="Username"
                  value={activeTab.auth.data.username || ""}
                  onChange={(e) => updateAuthData("username", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={activeTab.auth.data.password || ""}
                  onChange={(e) => updateAuthData("password", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Key
                </label>
                <Input
                  placeholder="X-API-Key"
                  value={activeTab.auth.data.key || ""}
                  onChange={(e) => updateAuthData("key", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Value
                </label>
                <Input
                  placeholder="Enter your API key"
                  value={activeTab.auth.data.value || ""}
                  onChange={(e) => updateAuthData("value", e.target.value)}
                  className="font-mono bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
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

      case "oauth2":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Grant Type
                </label>
                <Select
                  value={activeTab.auth.data.grant_type || "authorization_code"}
                  onValueChange={(value) => updateAuthData("grant_type", value)}
                  options={[
                    { value: "authorization_code", label: "Authorization Code" },
                    { value: "client_credentials", label: "Client Credentials" },
                    { value: "password", label: "Password" },
                    { value: "implicit", label: "Implicit" }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Access Token URL
                </label>
                <Input
                  placeholder="https://oauth.example.com/token"
                  value={activeTab.auth.data.access_token_url || ""}
                  onChange={(e) => updateAuthData("access_token_url", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Client ID
                </label>
                <Input
                  placeholder="Your client ID"
                  value={activeTab.auth.data.client_id || ""}
                  onChange={(e) => updateAuthData("client_id", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Client Secret
                </label>
                <Input
                  type="password"
                  placeholder="Your client secret"
                  value={activeTab.auth.data.client_secret || ""}
                  onChange={(e) => updateAuthData("client_secret", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
            {activeTab.auth.data.grant_type === "authorization_code" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                    Authorization URL
                  </label>
                  <Input
                    placeholder="https://oauth.example.com/auth"
                    value={activeTab.auth.data.auth_url || ""}
                    onChange={(e) => updateAuthData("auth_url", e.target.value)}
                    className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                    Callback URL
                  </label>
                  <Input
                    placeholder="http://localhost:8080/callback"
                    value={activeTab.auth.data.callback_url || ""}
                    onChange={(e) => updateAuthData("callback_url", e.target.value)}
                    className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                Scope
              </label>
              <Input
                placeholder="read write"
                value={activeTab.auth.data.scope || ""}
                onChange={(e) => updateAuthData("scope", e.target.value)}
                className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
              />
            </div>
          </div>
        );

      case "oauth1":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Consumer Key
                </label>
                <Input
                  placeholder="Your consumer key"
                  value={activeTab.auth.data.consumer_key || ""}
                  onChange={(e) => updateAuthData("consumer_key", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Consumer Secret
                </label>
                <Input
                  type="password"
                  placeholder="Your consumer secret"
                  value={activeTab.auth.data.consumer_secret || ""}
                  onChange={(e) => updateAuthData("consumer_secret", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Access Token
                </label>
                <Input
                  placeholder="Your access token"
                  value={activeTab.auth.data.token || ""}
                  onChange={(e) => updateAuthData("token", e.target.value)}
                  className="font-mono bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Token Secret
                </label>
                <Input
                  type="password"
                  placeholder="Your token secret"
                  value={activeTab.auth.data.token_secret || ""}
                  onChange={(e) => updateAuthData("token_secret", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
          </div>
        );

      case "digest":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Username
                </label>
                <Input
                  placeholder="Username"
                  value={activeTab.auth.data.username || ""}
                  onChange={(e) => updateAuthData("username", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={activeTab.auth.data.password || ""}
                  onChange={(e) => updateAuthData("password", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
          </div>
        );

      case "aws-signature":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Access Key ID
                </label>
                <Input
                  placeholder="Your AWS access key ID"
                  value={activeTab.auth.data.access_key || ""}
                  onChange={(e) => updateAuthData("access_key", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Secret Access Key
                </label>
                <Input
                  type="password"
                  placeholder="Your AWS secret access key"
                  value={activeTab.auth.data.secret_key || ""}
                  onChange={(e) => updateAuthData("secret_key", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Region
                </label>
                <Input
                  placeholder="us-east-1"
                  value={activeTab.auth.data.region || ""}
                  onChange={(e) => updateAuthData("region", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                  Service
                </label>
                <Input
                  placeholder="s3"
                  value={activeTab.auth.data.service || ""}
                  onChange={(e) => updateAuthData("service", e.target.value)}
                  className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#9aa0a6] mb-2">
                Session Token (Optional)
              </label>
              <Input
                placeholder="Your AWS session token"
                value={activeTab.auth.data.session_token || ""}
                onChange={(e) => updateAuthData("session_token", e.target.value)}
                className="bg-white dark:bg-[#2d2d2d] border-gray-300 dark:border-[#404040] focus:border-blue-500 focus:ring-blue-500 dark:text-[#e8eaed]"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-gray-500 dark:text-[#9aa0a6]">
            <p className="text-sm">This request is not using any authorization.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white dark:bg-[#1f1f1f] flex flex-col overflow-hidden">
      {/* Auth Type Selection - Compact */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#404040]">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-600 dark:text-[#9aa0a6]">Type</label>
          
          {/* Auth Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-md bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#383838] focus:border-blue-500 focus:ring-blue-500 min-w-[140px] justify-between dark:text-[#e8eaed]"
            >
              <span>{currentAuthType?.label || "No Auth"}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-[#5f6368]" />
            </button>

            {showAuthDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#404040] rounded-md shadow-lg z-10 min-w-[140px]">
                {AUTH_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAuthType(type.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors ${
                      activeTab.auth.type === type.value ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-[#9aa0a6]'
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