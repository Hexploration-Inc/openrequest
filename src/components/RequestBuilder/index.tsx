import { useRequestStore } from "../../lib/stores/request";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, Loader2 } from "lucide-react";
import { HttpMethod } from "../../lib/types";

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
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-2">
          {/* Method Selector */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium min-w-[100px]"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* URL Input */}
          <Input
            placeholder="Enter request URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />

          {/* Send Button */}
          <Button
            onClick={handleSendRequest}
            disabled={!url.trim() || isLoading}
            className="px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending
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
      <div className="flex-1">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="params" className="h-full p-4 m-0">
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Params tab coming soon...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="headers" className="h-full p-4 m-0">
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Headers tab coming soon...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="body" className="h-full p-4 m-0">
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Body tab coming soon...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="auth" className="h-full p-4 m-0">
              <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Auth tab coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}