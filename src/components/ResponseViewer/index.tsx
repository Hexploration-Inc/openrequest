import { useTabsStore } from "../../lib/stores/tabs";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Clock, Database } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../lib/theme-context';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
  if (status >= 300 && status < 400) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
  if (status >= 400 && status < 500) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  if (status >= 500) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  return 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-800 dark:text-[#e8eaed]';
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
  const { getActiveTab } = useTabsStore();
  const { theme } = useTheme();
  
  const activeTab = getActiveTab();
  const response = activeTab?.response;
  const isLoading = activeTab?.isLoading;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
        <div className="border-b border-gray-200 dark:border-[#404040] px-6 py-4 bg-gray-50 dark:bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-[#9aa0a6]">Sending request...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
          <div className="text-center">
            <div className="animate-pulse text-gray-400 mb-2">⏳</div>
            <p className="text-gray-500 dark:text-[#9aa0a6] text-sm">Waiting for response...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
        <div className="border-b border-gray-200 dark:border-[#404040] px-6 py-4 bg-gray-50 dark:bg-[#121212]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8eaed] uppercase tracking-wide">Response</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
          <div className="text-center">
            <div className="text-gray-300 mb-4 text-4xl">📡</div>
            <p className="text-gray-500 dark:text-[#9aa0a6] text-sm">Send a request to see the response</p>
          </div>
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
      <div className="border-b border-gray-200 dark:border-[#404040] px-6 py-4 bg-gray-50 dark:bg-[#2d2d2d]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-[#9aa0a6]">Status:</span>
            <Badge className={`font-semibold ${getStatusColor(response.status)}`}>
              {response.status}
            </Badge>
          </div>
          
          {response.responseTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#9aa0a6]">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{response.responseTime}ms</span>
            </div>
          )}
          
          {response.size && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#9aa0a6]">
              <Database className="h-4 w-4" />
              <span className="font-medium">{formatBytes(response.size)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Response Content Tabs */}
      <div className="flex-1 flex flex-col border-0">
        <Tabs defaultValue="body" className="h-full flex flex-col gap-0 border-0">
          <div>
            <TabsList className="h-12 bg-white dark:bg-[#1f1f1f] p-0 space-x-0 rounded-none w-full justify-start border-0">
              <TabsTrigger 
                value="body"
                className="rounded-none border-0 border-b-2 border-b-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 dark:hover:bg-[#383838] px-6 py-3 font-medium text-gray-600 dark:text-[#9aa0a6] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                Response Body
              </TabsTrigger>
              <TabsTrigger 
                value="headers"
                className="rounded-none border-0 border-b-2 border-b-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 dark:hover:bg-[#383838] px-6 py-3 font-medium text-gray-600 dark:text-[#9aa0a6] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                Headers
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="body" className="h-full p-0 m-0 border-0">
              <div className="h-full overflow-auto bg-white dark:bg-[#1f1f1f]">
                {formattedBody ? (
                  <SyntaxHighlighter
                    language={language}
                    style={theme === 'dark' ? {
                      ...oneDark,
                      'code[class*="language-"]': {
                        ...oneDark['code[class*="language-"]'],
                        background: 'transparent',
                      },
                      'pre[class*="language-"]': {
                        ...oneDark['pre[class*="language-"]'],
                        background: 'transparent',
                      }
                    } : {
                      ...oneLight,
                      'code[class*="language-"]': {
                        ...oneLight['code[class*="language-"]'],
                        background: 'transparent',
                      },
                      'pre[class*="language-"]': {
                        ...oneLight['pre[class*="language-"]'],
                        background: 'transparent',
                      }
                    }}
                    customStyle={{
                      margin: 0,
                      padding: '24px',
                      background: theme === 'dark' ? '#1f1f1f' : 'white',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    }}
                    showLineNumbers={false}
                    wrapLines={false}
                  >
                    {formattedBody}
                  </SyntaxHighlighter>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-[#9aa0a6] bg-gray-50 dark:bg-[#121212]">
                    <div className="text-center">
                      <div className="text-gray-300 mb-2 text-2xl">📄</div>
                      <p className="text-sm">Empty response body</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="headers" className="h-full p-0 m-0 border-0">
              <div className="h-full overflow-auto bg-white dark:bg-[#1f1f1f] p-6">
                <div className="space-y-3">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-6 py-3 border-b border-gray-100 dark:border-[#404040] last:border-b-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-[#e8eaed]">{key}</div>
                      <div className="col-span-2 text-sm text-gray-700 dark:text-[#9aa0a6] break-all font-mono">{value}</div>
                    </div>
                  ))}
                  
                  {Object.keys(response.headers).length === 0 && (
                    <div className="text-center text-gray-500 dark:text-[#9aa0a6] py-12">
                      <div className="text-gray-300 mb-2 text-2xl">📋</div>
                      <p className="text-sm">No response headers</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}