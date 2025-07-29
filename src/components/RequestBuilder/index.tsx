import { useTabsStore } from "../../lib/stores/tabs";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useHistoryStore } from "../../lib/stores/history";
import { useToast } from "../ui/toast";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "../../lib/hooks/useKeyboardShortcuts";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, Loader2, Save } from "lucide-react";
import { HttpMethod } from "../../lib/types";
import { ParamsTab } from "./ParamsTab";
import { HeadersTab } from "./HeadersTab";
import { BodyTab } from "./BodyTab";
import { AuthTab } from "./AuthTab";
import { invoke } from '@tauri-apps/api/core';
import { ApiResponse } from "../../lib/types";

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({ 
  value: method, 
  label: method 
}));

export function RequestBuilder() {
  const { getActiveTab, updateTabData, markTabAsUnsaved, markTabAsSaved } = useTabsStore();
  const { loadRequestsForCollection } = useCollectionsStore();
  const { addHistoryEntry } = useHistoryStore();
  const { success, error } = useToast();
  
  const activeTab = getActiveTab();

  // Keyboard shortcuts for this component
  useKeyboardShortcuts([
    {
      ...KEYBOARD_SHORTCUTS.SEND_REQUEST,
      action: () => {
        if (activeTab && activeTab.url.trim() && !activeTab.isLoading) {
          handleSendRequest();
        }
      },
    },
    {
      ...KEYBOARD_SHORTCUTS.SAVE_REQUEST,
      action: () => {
        if (activeTab && activeTab.requestId && !activeTab.isSaving) {
          handleSaveRequest();
        }
      },
    },
  ]);
  
  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No request tab open
      </div>
    );
  }

  const handleSendRequest = async () => {
    if (!activeTab.url.trim()) {
      error('Invalid URL', 'Please enter a valid URL to send the request');
      return;
    }

    // Update tab to show loading state
    updateTabData(activeTab.id, { isLoading: true }, false);
    
    try {
      const startTime = Date.now();
      
      // Convert params and headers to the format expected by backend
      const paramsObj: Record<string, string> = {};
      activeTab.params.filter(p => p.enabled && p.key.trim()).forEach(p => {
        paramsObj[p.key] = p.value;
      });

      const headersObj: Record<string, string> = {};
      activeTab.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        headersObj[h.key] = h.value;
      });

      // Prepare auth data
      let authType: string | undefined;
      let authData: string | undefined;
      
      if (activeTab.auth.type !== 'none') {
        authType = activeTab.auth.type;
        authData = JSON.stringify(activeTab.auth.data);
      }

      // Only include body for methods that support it
      const bodyAllowedMethods = ['POST', 'PUT', 'PATCH'];
      const requestBody = bodyAllowedMethods.includes(activeTab.method) && activeTab.bodyContent ? activeTab.bodyContent : null;

      const apiRequest = {
        method: activeTab.method,
        url: activeTab.url,
        params: paramsObj,
        headers: headersObj,
        body: requestBody,
        auth_type: authType,
        auth_data: authData,
      };

      const response = await invoke<ApiResponse>('send_api_request', {
        request: apiRequest,
      });

      const responseTime = Date.now() - startTime;
      const size = new Blob([response.body]).size;

      updateTabData(activeTab.id, {
        isLoading: false,
        response: {
          ...response,
          responseTime,
          size,
        },
      }, false);

      // Add to history
      addHistoryEntry({
        method: activeTab.method,
        url: activeTab.url,
        status: response.status,
        responseTime,
        size,
        params: paramsObj,
        headers: headersObj,
        bodyContent: requestBody,
        response,
      });

      success('Request completed', `${activeTab.method} request to ${activeTab.url} completed successfully`);
    } catch (err) {
      console.error('Request failed:', err);
      updateTabData(activeTab.id, { isLoading: false }, false);
      error('Request failed', err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleSaveRequest = async () => {
    if (!activeTab.requestId || !activeTab.collectionId) {
      error('Cannot save request', 'Missing request ID or collection ID');
      return;
    }
    
    updateTabData(activeTab.id, { isSaving: true }, false);
    
    try {
      // Convert params and headers to JSON strings
      const paramsObj: Record<string, string> = {};
      activeTab.params.filter(p => p.enabled && p.key.trim()).forEach(p => {
        paramsObj[p.key] = p.value;
      });

      const headersObj: Record<string, string> = {};
      activeTab.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
        headersObj[h.key] = h.value;
      });

      // Prepare auth data
      let authType: string | undefined;
      let authData: string | undefined;
      
      if (activeTab.auth.type !== 'none') {
        authType = activeTab.auth.type;
        authData = JSON.stringify(activeTab.auth.data);
      }

      const updatedRequest = {
        id: activeTab.requestId,
        collection_id: activeTab.collectionId,
        name: activeTab.name,
        method: activeTab.method,
        url: activeTab.url,
        params: JSON.stringify(paramsObj),
        headers: JSON.stringify(headersObj),
        body_type: activeTab.bodyType,
        body_str: activeTab.bodyContent || null,
        auth_type: authType || null,
        auth_data: authData || null,
        created_at: activeTab.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await invoke('update_request', { request: updatedRequest });
      
      markTabAsSaved(activeTab.id);
      updateTabData(activeTab.id, { isSaving: false }, false);
      
      // Refresh the requests in the sidebar after saving
      if (activeTab.collectionId) {
        loadRequestsForCollection(activeTab.collectionId);
      }
      
      success('Request saved', `"${activeTab.name}" has been saved successfully`);
      console.log('✅ Save completed successfully');
    } catch (err) {
      console.error('❌ Failed to save request:', err);
      updateTabData(activeTab.id, { isSaving: false }, false);
      error('Save failed', err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* URL Bar */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex gap-3 items-center">
          {/* Method Selector */}
          <div className="min-w-[90px]">
            <Select
              value={activeTab.method}
              onValueChange={(value) => {
                updateTabData(activeTab.id, { method: value as HttpMethod });
                markTabAsUnsaved(activeTab.id);
              }}
              options={HTTP_METHOD_OPTIONS}
              className={`text-sm font-semibold ${
                activeTab.method === 'GET' ? '[&>button]:bg-green-100 [&>button]:text-green-800 [&>button]:border-green-200' :
                activeTab.method === 'POST' ? '[&>button]:bg-blue-100 [&>button]:text-blue-800 [&>button]:border-blue-200' :
                activeTab.method === 'PUT' ? '[&>button]:bg-orange-100 [&>button]:text-orange-800 [&>button]:border-orange-200' :
                activeTab.method === 'DELETE' ? '[&>button]:bg-red-100 [&>button]:text-red-800 [&>button]:border-red-200' :
                activeTab.method === 'PATCH' ? '[&>button]:bg-purple-100 [&>button]:text-purple-800 [&>button]:border-purple-200' :
                '[&>button]:bg-gray-100 [&>button]:text-gray-800 [&>button]:border-gray-200'
              }`}
            />
          </div>

          {/* URL Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Enter request URL (e.g., https://api.example.com/users)"
              value={activeTab.url}
              onChange={(e) => {
                updateTabData(activeTab.id, { url: e.target.value });
                markTabAsUnsaved(activeTab.id);
              }}
              className="pr-24 font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Save Button - only show if request is loaded */}
          {activeTab.requestId && (
            <Button
              onClick={handleSaveRequest}
              disabled={activeTab.isSaving}
              variant="outline"
              className="px-6 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
              size="lg"
            >
              {activeTab.isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendRequest}
            disabled={!activeTab.url.trim() || activeTab.isLoading}
            className="px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            size="lg"
          >
            {activeTab.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Request Configuration Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs
          value={activeTab.activeTab}
          onValueChange={(value) => {
            // Don't mark as unsaved when just switching tabs
            const { getActiveTab, tabs, setActiveTab: setTabsActiveTab } = useTabsStore.getState();
            const currentTab = getActiveTab();
            if (currentTab) {
              const updatedTabs = tabs.map(tab =>
                tab.id === currentTab.id ? { ...tab, activeTab: value as any } : tab
              );
              useTabsStore.setState({ tabs: updatedTabs });
            }
          }}
          className="h-full flex flex-col"
        >
          <div className="bg-white">
            <TabsList className="h-10 bg-transparent p-0 space-x-0 rounded-none w-full justify-start border-b border-gray-200">
              <TabsTrigger 
                value="params" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600"
              >
                Params
              </TabsTrigger>
              <TabsTrigger 
                value="headers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600"
              >
                Headers
              </TabsTrigger>
              <TabsTrigger 
                value="body"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600"
              >
                Body
              </TabsTrigger>
              <TabsTrigger 
                value="auth"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-blue-600"
              >
                Auth
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="params" className="h-full m-0">
              <ParamsTab tabId={activeTab.id} />
            </TabsContent>
            
            <TabsContent value="headers" className="h-full m-0">
              <HeadersTab tabId={activeTab.id} />
            </TabsContent>
            
            <TabsContent value="body" className="h-full m-0">
              <BodyTab tabId={activeTab.id} />
            </TabsContent>
            
            <TabsContent value="auth" className="h-full m-0">
              <AuthTab tabId={activeTab.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}