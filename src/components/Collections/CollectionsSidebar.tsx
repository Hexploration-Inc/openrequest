import { useState } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useRequestStore } from "../../lib/stores/request";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { Plus, Folder, FileText, Settings, MoreVertical } from "lucide-react";

export function CollectionsSidebar() {
  const {
    collections,
    requests,
    selectedCollectionId,
    createCollection,
    selectCollection,
    createRequest,
  } = useCollectionsStore();

  const { loadRequest } = useRequestStore();

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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Collections</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateCollection(true)}
            className="h-7 w-7 p-0 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto">
        {collections.map((collection) => (
          <div key={collection.id} className="border-b border-gray-200 last:border-b-0">
            {/* Collection Header */}
            <div
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white transition-colors ${
                selectedCollectionId === collection.id
                  ? "bg-white"
                  : "bg-gray-50"
              }`}
              onClick={() => selectCollection(collection.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                <Folder className={`h-4 w-4 ${selectedCollectionId === collection.id ? 'text-orange-500' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{collection.name}</div>
                  {collection.description && (
                    <div className="text-xs text-gray-500 truncate">{collection.description}</div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Show collection options menu
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </div>

            {/* Requests List */}
            {selectedCollectionId === collection.id && (
              <div className="bg-white">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 px-6 py-2 cursor-pointer hover:bg-gray-50 transition-colors group border-l-2 border-transparent hover:border-l-orange-300"
                    onClick={() => loadRequest(request)}
                  >
                    <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 font-medium border-0 ${
                        request.method === 'GET' ? 'bg-green-100 text-green-700' :
                        request.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                        request.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                        request.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                        request.method === 'PATCH' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {request.method}
                    </Badge>
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {request.name}
                    </span>
                  </div>
                ))}
                
                {/* Add Request Button */}
                <div className="px-6 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setShowCreateRequest(true)}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {collections.length === 0 && (
          <div className="text-center py-12 px-4">
            <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-4">No collections yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateCollection(true)}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-2" />
              Create Collection
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={showCreateCollection}
        onClose={() => {
          setShowCreateCollection(false);
          setNewCollectionName("");
          setNewCollectionDescription("");
        }}
        title="Create New Collection"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Name
            </label>
            <Input
              placeholder="My API Collection"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <Input
              placeholder="Description of this collection"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
                setNewCollectionDescription("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateRequest}
        onClose={() => {
          setShowCreateRequest(false);
          setNewRequestName("");
          setNewRequestUrl("");
        }}
        title="Create New Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Name
            </label>
            <Input
              placeholder="Get Users"
              value={newRequestName}
              onChange={(e) => setNewRequestName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <Input
              placeholder="https://api.example.com/users"
              value={newRequestUrl}
              onChange={(e) => setNewRequestUrl(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRequest(false);
                setNewRequestName("");
                setNewRequestUrl("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={!newRequestName.trim() || !newRequestUrl.trim()}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}