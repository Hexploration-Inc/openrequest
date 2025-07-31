import { useState } from "react";
import { useTabsStore } from "../../lib/stores/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Clock, Database, Search, Copy, Download, Eye, Filter } from "lucide-react";
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

function parseCookies(headers: Record<string, string>): Array<{name: string, value: string, attributes: string}> {
  const cookies: Array<{name: string, value: string, attributes: string}> = [];
  const setCookieHeaders = headers['Set-Cookie'] || headers['set-cookie'] || '';

  if (setCookieHeaders) {
    const cookieStrings = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    cookieStrings.forEach(cookieString => {
      const parts = cookieString.split(';');
      const [name, value] = parts[0].split('=');
      const attributes = parts.slice(1).join(';').trim();
      cookies.push({
        name: name?.trim() || '',
        value: value?.trim() || '',
        attributes
      });
    });
  }

  return cookies;
}

function highlightSearchMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background-color: yellow; color: black;">$1</mark>');
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ResponseViewer() {
  const { getActiveTab } = useTabsStore();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('body');
  const [showRawResponse, setShowRawResponse] = useState(false);

  const tab = getActiveTab();
  const response = tab?.response;
  const isLoading = tab?.isLoading;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
        <div className="border-b border-gray-200 dark:border-[#404040] px-4 py-2 bg-white dark:bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-[#9aa0a6]">Sending request...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
          <div className="text-center">
            <div className="animate-pulse text-gray-400 mb-2 text-2xl">⏳</div>
            <p className="text-gray-500 dark:text-[#9aa0a6] text-xs">Waiting for response...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
        <div className="border-b border-gray-200 dark:border-[#404040] px-4 py-2 bg-white dark:bg-[#1f1f1f]">
          <h2 className="text-xs font-medium text-gray-600 dark:text-[#e8eaed] uppercase tracking-wide">Response</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
          <div className="text-center">
            <div className="text-gray-300 mb-3 text-3xl">📡</div>
            <p className="text-gray-500 dark:text-[#9aa0a6] text-xs">Send a request to see the response</p>
          </div>
        </div>
      </div>
    );
  }

  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
  const language = detectLanguage(contentType);
  const formattedBody = formatResponseBody(response.body, contentType);
  const cookies = parseCookies(response.headers);

  // Filter headers based on search query
  const filteredHeaders = Object.entries(response.headers).filter(([key, value]) =>
    !searchQuery ||
    key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
      {/* Response Status Bar - Compact */}
      <div className="border-b border-gray-200 dark:border-[#404040] px-4 py-2 bg-white dark:bg-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`text-xs font-medium ${getStatusColor(response.status)}`}>
              {response.status}
            </Badge>

            {response.responseTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-[#9aa0a6]">
                <Clock className="h-3 w-3" />
                <span>{response.responseTime}ms</span>
              </div>
            )}

            {response.size && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-[#9aa0a6]">
                <Database className="h-3 w-3" />
                <span>{formatBytes(response.size)}</span>
              </div>
            )}
          </div>

          {/* Response Actions - Minimal */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(formattedBody)}
              className="h-6 w-6 p-0"
              title="Copy response body"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadFile(formattedBody, 'response.json', contentType)}
              className="h-6 w-6 p-0"
              title="Download response"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="h-6 w-6 p-0"
              title={showRawResponse ? 'Show formatted' : 'Show raw'}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar - Hidden by default, show only when needed */}
      {searchQuery && (
        <div className="border-b border-gray-200 dark:border-[#404040] px-4 py-2 bg-white dark:bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search in response..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Response Content Tabs - Compact */}
      <div className="flex-1 flex flex-col">
            <Tabs defaultValue="body" className="h-full flex flex-col">
              <div className="bg-white dark:bg-[#1f1f1f] px-4">
                <TabsList className="h-8 bg-transparent p-0 space-x-0 rounded-none justify-start">
                  <TabsTrigger
                    value="body"
                    className="rounded-none border-b border-b-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 dark:hover:bg-[#383838] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#9aa0a6] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                  >
                    Body
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="rounded-none border-b border-b-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 dark:hover:bg-[#383838] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#9aa0a6] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                  >
                    Headers ({filteredHeaders.length})
                  </TabsTrigger>
                  {cookies.length > 0 && (
                    <TabsTrigger
                      value="cookies"
                      className="rounded-none border-b border-b-transparent data-[state=active]:border-b-blue-500 data-[state=active]:bg-transparent hover:bg-gray-50 dark:hover:bg-[#383838] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#9aa0a6] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                    >
                      Cookies ({cookies.length})
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="body" className="h-full p-0 m-0 border-0">
                  <div className="h-full overflow-auto bg-white dark:bg-[#1f1f1f]">
                    {formattedBody ? (
                      showRawResponse ? (
                        <div className="p-6 font-mono text-sm whitespace-pre-wrap text-gray-900 dark:text-[#e8eaed]">
                          {searchQuery ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: highlightSearchMatch(formattedBody, searchQuery)
                              }}
                            />
                          ) : (
                            formattedBody
                          )}
                        </div>
                      ) : (
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
                      )
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
                      {filteredHeaders.map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-6 py-3 border-b border-gray-100 dark:border-[#404040] last:border-b-0 group">
                          <div className="font-medium text-sm text-gray-900 dark:text-[#e8eaed]">
                            {searchQuery ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchMatch(key, searchQuery) }} />
                            ) : (
                              key
                            )}
                          </div>
                          <div className="col-span-2 text-sm text-gray-700 dark:text-[#9aa0a6] break-all font-mono">
                            {searchQuery ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightSearchMatch(value, searchQuery) }} />
                            ) : (
                              value
                            )}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => copyToClipboard(value)}
                              className="h-6 w-6 p-0"
                              title="Copy value"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {filteredHeaders.length === 0 && !searchQuery && (
                        <div className="text-center text-gray-500 dark:text-[#9aa0a6] py-12">
                          <div className="text-gray-300 mb-2 text-2xl">📋</div>
                          <p className="text-sm">No response headers</p>
                        </div>
                      )}

                      {filteredHeaders.length === 0 && searchQuery && (
                        <div className="text-center text-gray-500 dark:text-[#9aa0a6] py-12">
                          <div className="text-gray-300 mb-2 text-2xl">🔍</div>
                          <p className="text-sm">No headers match your search</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {cookies.length > 0 && (
                  <TabsContent value="cookies" className="h-full p-0 m-0 border-0">
                    <div className="h-full overflow-auto bg-white dark:bg-[#1f1f1f] p-6">
                      <div className="space-y-4">
                        {cookies.map((cookie, index) => (
                          <div key={index} className="border border-gray-200 dark:border-[#404040] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-[#383838] transition-colors group">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-sm text-gray-900 dark:text-[#e8eaed]">
                                {cookie.name}
                              </div>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => copyToClipboard(`${cookie.name}=${cookie.value}`)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                title="Copy cookie"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-[#9aa0a6] font-mono break-all mb-2">
                              {cookie.value}
                            </div>
                            {cookie.attributes && (
                              <div className="text-xs text-gray-500 dark:text-[#5f6368] font-mono">
                                {cookie.attributes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        </div>
      );
}
