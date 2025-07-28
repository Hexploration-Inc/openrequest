import { useRequestStore } from "../../lib/stores/request";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, Loader2 } from "lucide-react";
import { HttpMethod } from "../../lib/types";
import { ParamsTab } from "./ParamsTab";
import { HeadersTab } from "./HeadersTab";
import { BodyTab } from "./BodyTab";
import { AuthTab } from "./AuthTab";

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export function RequestBuilder() {
  const {
    method,
    url,
    isLoading,
    activeTab,
    setMethod,
    setUrl,
    setActiveTab,
    sendRequest,
  } = useRequestStore();

  const handleSendRequest = async () => {
    try {
      await sendRequest();
    } catch (error) {
      console.error('Failed to send request:', error);
      // TODO: Show error toast
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* URL Bar */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex gap-3 items-center">
          {/* Method Selector */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className={`px-3 py-2 border-0 rounded-md text-sm font-semibold min-w-[90px] focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              method === 'GET' ? 'bg-green-100 text-green-800' :
              method === 'POST' ? 'bg-blue-100 text-blue-800' :
              method === 'PUT' ? 'bg-orange-100 text-orange-800' :
              method === 'DELETE' ? 'bg-red-100 text-red-800' :
              method === 'PATCH' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* URL Input */}
          <div className="flex-1 relative">
            <Input
              placeholder="Enter request URL (e.g., https://api.example.com/users)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pr-24 font-mono text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendRequest}
            disabled={!url.trim() || isLoading}
            className="px-8 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            size="lg"
          >
            {isLoading ? (
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
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="h-full flex flex-col"
        >
          <div className="border-b border-gray-200 bg-white">
            <TabsList className="h-12 bg-transparent p-0 space-x-0 rounded-none w-full justify-start">
              <TabsTrigger 
                value="params" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Params
              </TabsTrigger>
              <TabsTrigger 
                value="headers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Headers
              </TabsTrigger>
              <TabsTrigger 
                value="body"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Body
              </TabsTrigger>
              <TabsTrigger 
                value="auth"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-3 font-medium"
              >
                Auth
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="params" className="h-full m-0">
              <ParamsTab />
            </TabsContent>
            
            <TabsContent value="headers" className="h-full m-0">
              <HeadersTab />
            </TabsContent>
            
            <TabsContent value="body" className="h-full m-0">
              <BodyTab />
            </TabsContent>
            
            <TabsContent value="auth" className="h-full m-0">
              <AuthTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}