import { useState } from 'react';
import { useHistoryStore } from '../../lib/stores/history';
import { useTabsStore } from '../../lib/stores/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { Clock, Search, Trash2, X, ExternalLink } from 'lucide-react';
import { HttpMethod } from '../../lib/types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const { history, clearHistory, removeHistoryEntry } = useHistoryStore();
  const { openNewTabWithRequest } = useTabsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredHistory = history.filter((entry) => 
    entry.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-700';
    if (status >= 400) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PUT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenInNewTab = (entry: typeof history[0]) => {
    const params = Object.entries(entry.params || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));

    const headers = Object.entries(entry.headers || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));

    openNewTabWithRequest({
      name: `${entry.method} ${new URL(entry.url).pathname}`,
      method: entry.method,
      url: entry.url,
      params,
      headers,
      bodyContent: entry.bodyContent || '',
    });

    onClose();
  };

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Request History"
        size="large"
      >
        <div className="space-y-4 max-h-[70vh] flex flex-col">
          {/* Header Controls */}
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              disabled={history.length === 0}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <div>
                    <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No requests found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <div>
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No request history yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Send some requests to see them here
                    </p>
                  </div>
                )}
              </div>
            ) : (
              filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Method and Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs font-medium ${getMethodColor(entry.method)}`}>
                          {entry.method}
                        </Badge>
                        {entry.status && (
                          <Badge className={`text-xs ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>

                      {/* URL */}
                      <div className="font-mono text-sm text-gray-900 mb-2 break-all">
                        {entry.url}
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {entry.responseTime && (
                          <span>{entry.responseTime}ms</span>
                        )}
                        {entry.size && (
                          <span>{(entry.size / 1024).toFixed(1)} KB</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenInNewTab(entry)}
                        className="h-8 w-8 p-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHistoryEntry(entry.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Remove from history"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear History"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to clear all request history? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearHistory}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All History
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}