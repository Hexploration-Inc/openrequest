import { useRequestStore } from "../../lib/stores/request";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Clock, Database } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
  if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800';
  if (status >= 400 && status < 500) return 'bg-red-100 text-red-800';
  if (status >= 500) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

function detectLanguage(contentType: string): string {
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('xml')) return 'xml';
  if (contentType.includes('html')) return 'html';
  if (contentType.includes('javascript')) return 'javascript';
  if (contentType.includes('css')) return 'css';
  return 'text';
}

function formatResponseBody(body: string, contentType: string): string {
  try {
    if (contentType.includes('json')) {
      return JSON.stringify(JSON.parse(body), null, 2);
    }
  } catch (e) {
    // Return as-is if parsing fails
  }
  return body;
}

export function ResponseViewer() {
  const { response, isLoading } = useRequestStore();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Sending request...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Waiting for response...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Response</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Send a request to see the response</p>
        </div>
      </div>
    );
  }

  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
  const language = detectLanguage(contentType);
  const formattedBody = formatResponseBody(response.body, contentType);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Response Status Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(response.status)}>
              {response.status}
            </Badge>
            
            {response.responseTime && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{response.responseTime}ms</span>
              </div>
            )}
            
            {response.size && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Database className="h-3 w-3" />
                <span>{formatBytes(response.size)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Content Tabs */}
      <div className="flex-1">
        <Tabs defaultValue="body" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="body" className="h-full p-0 m-0">
              <div className="h-full overflow-auto">
                {formattedBody ? (
                  <SyntaxHighlighter
                    language={language}
                    style={oneLight}
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      background: 'white',
                      fontSize: '12px',
                      lineHeight: '1.4',
                    }}
                  >
                    {formattedBody}
                  </SyntaxHighlighter>
                ) : (
                  <div className="p-4 text-gray-500 text-center">
                    Empty response body
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="headers" className="h-full p-4 m-0 overflow-auto">
              <div className="space-y-2">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-sm text-gray-700">{key}</div>
                    <div className="col-span-2 text-sm text-gray-600 break-all">{value}</div>
                  </div>
                ))}
                
                {Object.keys(response.headers).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No response headers
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}