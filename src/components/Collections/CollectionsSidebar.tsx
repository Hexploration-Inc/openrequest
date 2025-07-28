import { useState } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Plus, Folder, FileText } from "lucide-react";

export function CollectionsSidebar() {
  const {
    collections,
    requests,
    selectedCollectionId,
    createCollection,
    selectCollection,
    createRequest,
  } = useCollectionsStore();

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newRequestName, setNewRequestName] = useState("");
  const [newRequestMethod, setNewRequestMethod] = useState("GET");
  const [newRequestUrl, setNewRequestUrl] = useState("");

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      await createCollection(newCollectionName, newCollectionDescription);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setShowCreateCollection(false);
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequestName.trim() || !newRequestUrl.trim() || !selectedCollectionId) return;
    
    try {
      await createRequest(selectedCollectionId, newRequestName, newRequestMethod, newRequestUrl);
      setNewRequestName("");
      setNewRequestUrl("");
      setShowCreateRequest(false);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateCollection(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {collections.map((collection) => (
          <div key={collection.id} className="space-y-2">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedCollectionId === collection.id
                  ? "bg-blue-50 border border-blue-200"
                  : "border border-gray-200"
              }`}
              onClick={() => selectCollection(collection.id)}
            >
              <Folder className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <div className="font-medium text-sm">{collection.name}</div>
                {collection.description && (
                  <div className="text-xs text-gray-500">{collection.description}</div>
                )}
              </div>
            </div>

            {/* Show requests if this collection is selected */}
            {selectedCollectionId === collection.id && (
              <div className="ml-6 space-y-1">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50"
                  >
                    <FileText className="h-3 w-3 text-gray-400" />
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {request.method}
                    </Badge>
                    <span className="text-sm text-gray-700 truncate">
                      {request.name}
                    </span>
                  </div>
                ))}
                
                {/* Add Request Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start text-xs"
                  onClick={() => setShowCreateRequest(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Request
                </Button>
              </div>
            )}
          </div>
        ))}

        {collections.length === 0 && (
          <div className="text-center py-8">
            <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No collections yet</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setShowCreateCollection(true)}
            >
              Create your first collection
            </Button>
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Create New Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateCollection(false);
                    setNewCollectionName("");
                    setNewCollectionDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim()}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Create New Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Request name"
                value={newRequestName}
                onChange={(e) => setNewRequestName(e.target.value)}
              />
              <select
                className="w-full p-2 border rounded"
                value={newRequestMethod}
                onChange={(e) => setNewRequestMethod(e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
              <Input
                placeholder="URL (e.g., https://api.example.com/users)"
                value={newRequestUrl}
                onChange={(e) => setNewRequestUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateRequest(false);
                    setNewRequestName("");
                    setNewRequestUrl("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!newRequestName.trim() || !newRequestUrl.trim()}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}