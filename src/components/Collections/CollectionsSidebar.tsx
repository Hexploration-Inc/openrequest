import { useState } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useTabsStore } from "../../lib/stores/tabs";
import { useToast } from "../ui/toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { Plus, Folder, FileText, ChevronRight, ChevronDown } from "lucide-react";

interface CollectionsSidebarProps {
  collapsed?: boolean;
}

export function CollectionsSidebar({ collapsed = false }: CollectionsSidebarProps) {
  const {
    collections,
    requests,
    selectedCollectionId,
    createCollection,
    selectCollection,
    createRequest,
  } = useCollectionsStore();

  const { openRequestInTab } = useTabsStore();
  const { success, error } = useToast();

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
      success("Collection created", `"${newCollectionName}" has been created successfully`);
    } catch (err) {
      console.error("Failed to create collection:", err);
      error("Failed to create collection", err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleCreateRequest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    console.log("🚀 Create request button clicked!");
    console.log("Form state:", {
      name: newRequestName,
      method: newRequestMethod,
      url: newRequestUrl,
      collectionId: selectedCollectionId,
      nameLength: newRequestName.length,
      urlLength: newRequestUrl.length
    });

    // More detailed validation with console logs
    if (!newRequestName || !newRequestName.trim()) {
      console.error("❌ Request name is empty or only whitespace");
      error("Validation Error", "Please enter a request name");
      return;
    }
    
    if (!newRequestUrl || !newRequestUrl.trim()) {
      console.error("❌ Request URL is empty or only whitespace");
      error("Validation Error", "Please enter a request URL");
      return;
    }
    
    if (!selectedCollectionId) {
      console.error("❌ No collection selected. Available collections:", collections);
      error("Validation Error", "No collection selected");
      return;
    }
    
    console.log("✅ All validations passed, calling createRequest...");
    
    try {
      console.log("📞 Calling createRequest with params:", {
        collectionId: selectedCollectionId,
        name: newRequestName.trim(),
        method: newRequestMethod,
        url: newRequestUrl.trim()
      });
      
      await createRequest(selectedCollectionId, newRequestName.trim(), newRequestMethod, newRequestUrl.trim());
      
      console.log("✅ Request created successfully, clearing form...");
      setNewRequestName("");
      setNewRequestUrl("");
      setNewRequestMethod("GET");
      setShowCreateRequest(false);
      success("Request created", `"${newRequestName}" has been created successfully`);
      
      console.log("✅ Form cleared and modal closed");
    } catch (err) {
      console.error("❌ Failed to create request:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      error("Failed to create request", err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Collapsed Header */}
        <div className="px-3 py-4 border-b border-slate-100">
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateCollection(true)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50 transition-colors"
              title="Create Collection"
            >
              <Plus className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Collapsed Collections List */}
        <div className="flex-1 overflow-y-auto py-2">
          {collections.map((collection) => (
            <div key={collection.id} className="mb-1 px-2">
              <div
                className={`w-10 h-10 rounded-lg cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-center ${
                  selectedCollectionId === collection.id
                    ? "bg-blue-50 border border-blue-100"
                    : ""
                }`}
                onClick={() => selectCollection(collection.id)}
                title={collection.name}
              >
                <Folder className={`h-4 w-4 ${
                  selectedCollectionId === collection.id ? 'text-blue-500' : 'text-slate-400'
                }`} />
              </div>
            </div>
          ))}

          {collections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-2">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-2">
                <Folder className="h-5 w-5 text-slate-300" />
              </div>
            </div>
          )}
        </div>

        {/* Modals remain the same */}
        <Modal
          isOpen={showCreateCollection}
          onClose={() => {
            setShowCreateCollection(false);
            setNewCollectionName("");
            setNewCollectionDescription("");
          }}
          title="Create Collection"
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
                className="w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <Input
                placeholder="A brief description of this collection"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                className="w-full"
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Collections</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateCollection(true)}
            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto py-2">
        {collections.map((collection) => (
          <div key={collection.id} className="mb-1">
            {/* Collection Header */}
            <div
              className={`group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${
                selectedCollectionId === collection.id
                  ? "bg-blue-50 border border-blue-100"
                  : ""
              }`}
              onClick={() => selectCollection(collection.id)}
            >
              <div className="flex items-center gap-2 text-slate-400">
                {selectedCollectionId === collection.id ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Folder className={`h-4 w-4 ${selectedCollectionId === collection.id ? 'text-blue-500' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${
                  selectedCollectionId === collection.id ? 'text-blue-900' : 'text-slate-900'
                }`}>
                  {collection.name}
                </div>
                {collection.description && (
                  <div className="text-xs text-slate-500 truncate mt-0.5">{collection.description}</div>
                )}
              </div>
            </div>

            {/* Requests List */}
            {selectedCollectionId === collection.id && (
              <div className="ml-6 space-y-1">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
                    onClick={() => openRequestInTab(request)}
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 font-medium border rounded-full ${
                        request.method === 'GET' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        request.method === 'POST' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        request.method === 'PUT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        request.method === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                        request.method === 'PATCH' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {request.method}
                    </Badge>
                    <span className="text-sm text-slate-700 truncate flex-1 font-medium">
                      {request.name}
                    </span>
                  </div>
                ))}
                
                {/* Add Request Button */}
                <div className="px-6 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs h-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors rounded-lg"
                    onClick={() => setShowCreateRequest(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Add Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium mb-2">No collections yet</h3>
            <p className="text-slate-500 text-sm text-center mb-6 max-w-xs">
              Create your first collection to organize your API requests
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateCollection(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
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
        title="Create Collection"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Collection Name
            </label>
            <Input
              placeholder="My API Collection"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              autoFocus
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (optional)
            </label>
            <Input
              placeholder="A brief description of this collection"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
                setNewCollectionDescription("");
              }}
              className="flex-1 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Create Collection
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
        title="Create Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Request Name
            </label>
            <Input
              placeholder="Get Users"
              value={newRequestName}
              onChange={(e) => {
                console.log("Name input changed:", e.target.value);
                setNewRequestName(e.target.value);
              }}
              autoFocus
              className="focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Method
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              value={newRequestMethod}
              onChange={(e) => {
                console.log("Method changed:", e.target.value);
                setNewRequestMethod(e.target.value);
              }}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL
            </label>
            <Input
              placeholder="https://api.example.com/users"
              value={newRequestUrl}
              onChange={(e) => {
                console.log("URL input changed:", e.target.value);
                setNewRequestUrl(e.target.value);
              }}
              className="focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("Cancel button clicked");
                setShowCreateRequest(false);
                setNewRequestName("");
                setNewRequestUrl("");
              }}
              className="flex-1 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newRequestName.trim() || !newRequestUrl.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={(e) => {
                console.log("Create Request button clicked directly");
                e.preventDefault();
                handleCreateRequest(e);
              }}
            >
              Create Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}