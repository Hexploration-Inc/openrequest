import { useState } from "react";
import { useCollectionsStore } from "../../lib/stores/collections";
import { useTabsStore } from "../../lib/stores/tabs";
import { useToast } from "../ui/toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { Plus, Folder, FileText, ChevronRight, ChevronDown, Edit, Trash2, X, Check } from "lucide-react";

interface CollectionsSidebarProps {
  collapsed?: boolean;
}

export function CollectionsSidebar({ collapsed = false }: CollectionsSidebarProps) {
  const {
    collections,
    selectedCollectionId,
    createCollection,
    selectCollection,
    createRequest,
    updateCollection,
    deleteCollection,
    updateRequest,
    deleteRequest,
    getRequestsForCollection,
  } = useCollectionsStore();

  const { openRequestInTab } = useTabsStore();
  const { success, error } = useToast();

  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newRequestName, setNewRequestName] = useState("");
  const [newRequestMethod, setNewRequestMethod] = useState("GET");
  const [newRequestUrl, setNewRequestUrl] = useState("");
  
  // Inline editing states
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'collection' | 'request', id: string, name: string} | null>(null);

  const toggleCollectionExpanded = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const isCollectionExpanded = (collectionId: string) => {
    return expandedCollections.has(collectionId);
  };

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

  // Inline editing handlers
  const handleStartEditCollection = (id: string, name: string, description: string) => {
    setEditingCollectionId(id);
    setEditName(name);
    setEditDescription(description);
  };

  const handleStartEditRequest = (id: string, name: string) => {
    setEditingRequestId(id);
    setEditName(name);
  };

  const handleCancelEdit = () => {
    setEditingCollectionId(null);
    setEditingRequestId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveCollectionEdit = async (id: string) => {
    if (!editName.trim()) return;
    
    try {
      await updateCollection(id, editName.trim(), editDescription.trim() || undefined);
      handleCancelEdit();
      success("Collection updated", `"${editName}" has been updated successfully`);
    } catch (err) {
      console.error("Failed to update collection:", err);
      error("Failed to update collection", err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleSaveRequestEdit = async (id: string) => {
    if (!editName.trim()) return;
    
    try {
      await updateRequest(id, editName.trim());
      handleCancelEdit();
      success("Request updated", `"${editName}" has been updated successfully`);
    } catch (err) {
      console.error("Failed to update request:", err);
      error("Failed to update request", err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleDeleteCollection = (id: string, name: string) => {
    console.log("🗑️ UI: handleDeleteCollection called with:", { id, name });
    setDeleteTarget({ type: 'collection', id, name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    console.log("🗑️ UI: handleDeleteRequest called with:", { id, name });
    setDeleteTarget({ type: 'request', id, name });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    const { type, id, name } = deleteTarget;
    console.log(`✅ UI: User confirmed ${type} deletion, proceeding...`);
    
    try {
      if (type === 'collection') {
        console.log("🔄 UI: Calling deleteCollection from store...");
        await deleteCollection(id);
        console.log("✅ UI: deleteCollection completed successfully");
        success("Collection deleted", `"${name}" has been deleted successfully`);
      } else {
        console.log("🔄 UI: Calling deleteRequest from store...");
        await deleteRequest(id);
        console.log("✅ UI: deleteRequest completed successfully");
        success("Request deleted", `"${name}" has been deleted successfully`);
      }
    } catch (err) {
      console.error(`❌ UI: Failed to delete ${type}:`, err);
      error(`Failed to delete ${type}`, err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    console.log("🚫 UI: User cancelled deletion");
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
        {/* Collapsed Header */}
        <div className="px-3 py-4 border-b border-slate-100 dark:border-[#404040]">
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateCollection(true)}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50 dark:hover:bg-[#383838] transition-colors"
              title="Create Collection"
            >
              <Plus className="h-4 w-4 text-slate-600 dark:text-[#9aa0a6]" />
            </Button>
          </div>
        </div>

        {/* Collapsed Collections List */}
        <div className="flex-1 overflow-y-auto py-2">
          {collections.map((collection) => (
            <div key={collection.id} className="mb-1 px-2">
              <div
                className={`w-10 h-10 rounded-lg cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-[#383838] flex items-center justify-center ${
                  selectedCollectionId === collection.id
                    ? "bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800"
                    : ""
                }`}
                onClick={() => selectCollection(collection.id)}
                title={collection.name}
              >
                <Folder className={`h-4 w-4 ${
                  selectedCollectionId === collection.id ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-[#5f6368]'
                }`} />
              </div>
            </div>
          ))}

          {collections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-2">
              <div className="w-10 h-10 bg-slate-50 dark:bg-[#2d2d2d] rounded-lg flex items-center justify-center mb-2">
                <Folder className="h-5 w-5 text-slate-300 dark:text-[#5f6368]" />
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
          title="Create New Collection"
          size="medium"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
                Name *
              </label>
              <Input
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
                Description
              </label>
              <Input
                placeholder="Add a description for this collection"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all"
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
                className="flex-1 h-10 border-slate-300 dark:border-[#404040] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-[#e8eaed]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium shadow-sm transition-all"
              >
                Create Collection
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1f1f1f]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-[#404040]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-[#e8eaed]">Collections</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateCollection(true)}
            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50 dark:hover:bg-[#383838] transition-colors"
          >
            <Plus className="h-4 w-4 text-slate-600 dark:text-[#9aa0a6]" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto py-2">
        {collections.map((collection) => (
          <div key={collection.id} className="mb-1">
            {/* Collection Header */}
            <div
              className={`group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-[#383838] ${
                selectedCollectionId === collection.id
                  ? "bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400 dark:text-[#5f6368]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollectionExpanded(collection.id);
                  }}
                  className="p-0.5 hover:bg-slate-100 dark:hover:bg-[#404040] rounded"
                >
                  {isCollectionExpanded(collection.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Folder className={`h-4 w-4 ${selectedCollectionId === collection.id ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-[#5f6368]'}`} />
              </div>
              {editingCollectionId === collection.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#404040]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCollectionEdit(collection.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="h-7 text-xs text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#404040]"
                    placeholder="Description (optional)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCollectionEdit(collection.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveCollectionEdit(collection.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => selectCollection(collection.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className={`font-medium text-sm truncate ${
                      selectedCollectionId === collection.id ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-[#e8eaed]'
                    }`}>
                      {collection.name}
                    </div>
                    {collection.description && (
                      <div className="text-xs text-slate-500 dark:text-[#9aa0a6] truncate mt-0.5">{collection.description}</div>
                    )}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditCollection(collection.id, collection.name, collection.description || "");
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      title="Rename collection"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id, collection.name);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete collection"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Requests List */}
            {isCollectionExpanded(collection.id) && (
              <div className="ml-6 space-y-1">
                {getRequestsForCollection(collection.id).map((request) => (
                  <div
                    key={request.id}
                    className="group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#383838] transition-all"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400 dark:text-[#5f6368] flex-shrink-0" />
                    <span className={`px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#2a2a2a] ${
                        request.method === 'GET' ? 'text-emerald-600 dark:text-emerald-400' :
                        request.method === 'POST' ? 'text-blue-600 dark:text-blue-400' :
                        request.method === 'PUT' ? 'text-amber-600 dark:text-amber-400' :
                        request.method === 'DELETE' ? 'text-red-600 dark:text-red-400' :
                        request.method === 'PATCH' ? 'text-purple-600 dark:text-purple-400' :
                        'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {request.method}
                    </span>
                    
                    {editingRequestId === request.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a] border-slate-300 dark:border-[#404040]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRequestEdit(request.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveRequestEdit(request.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-sm text-slate-700 dark:text-[#9aa0a6] truncate flex-1 font-medium cursor-pointer"
                          onClick={() => openRequestInTab(request)}
                        >
                          {request.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditRequest(request.id, request.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                            title="Rename request"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(request.id, request.name);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete request"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {/* Add Request Button */}
                <div className="px-6 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-xs h-8 text-slate-500 dark:text-[#9aa0a6] hover:text-slate-700 dark:hover:text-[#e8eaed] hover:bg-slate-50 dark:hover:bg-[#383838] transition-colors rounded-lg"
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
            <div className="w-16 h-16 bg-slate-50 dark:bg-[#2d2d2d] rounded-2xl flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-slate-300 dark:text-[#5f6368]" />
            </div>
            <h3 className="text-slate-900 dark:text-[#e8eaed] font-medium mb-2">No collections yet</h3>
            <p className="text-slate-500 dark:text-[#9aa0a6] text-sm text-center mb-6 max-w-xs">
              Create your first collection to organize your API requests
            </p>
            <Button
              size="sm"
              onClick={() => setShowCreateCollection(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
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
        title="Create New Collection"
        size="medium"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
              Name *
            </label>
            <Input
              placeholder="Enter collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              autoFocus
              className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
              Description
            </label>
            <Input
              placeholder="Add a description for this collection"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a]"
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
              className="flex-1 h-10 border-slate-300 dark:border-[#404040] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-[#e8eaed]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium shadow-sm transition-all"
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
        title="Add Request"
        size="medium"
      >
        <form onSubmit={handleCreateRequest} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
              Request name *
            </label>
            <Input
              placeholder="Enter request name"
              value={newRequestName}
              onChange={(e) => {
                console.log("Name input changed:", e.target.value);
                setNewRequestName(e.target.value);
              }}
              autoFocus
              className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a]"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
                Method
              </label>
              <Select
                value={newRequestMethod}
                onValueChange={(value) => {
                  console.log("Method changed:", value);
                  setNewRequestMethod(value);
                }}
                options={[
                  { value: "GET", label: "GET" },
                  { value: "POST", label: "POST" },
                  { value: "PUT", label: "PUT" },
                  { value: "DELETE", label: "DELETE" },
                  { value: "PATCH", label: "PATCH" },
                  { value: "HEAD", label: "HEAD" },
                  { value: "OPTIONS", label: "OPTIONS" }
                ]}
                variant="minimal"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-[#e8eaed]">
                Request URL *
              </label>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={newRequestUrl}
                onChange={(e) => {
                  console.log("URL input changed:", e.target.value);
                  setNewRequestUrl(e.target.value);
                }}
                className="w-full h-10 px-3 border-slate-300 dark:border-[#404040] rounded-lg focus:border-orange-500 focus:ring-orange-500/20 focus:ring-2 transition-all text-slate-900 dark:text-[#e8eaed] bg-white dark:bg-[#2a2a2a]"
                required
              />
            </div>
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
              className="flex-1 h-10 border-slate-300 dark:border-[#404040] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-[#e8eaed]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!newRequestName.trim() || !newRequestUrl.trim()}
              className="flex-1 h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium shadow-sm transition-all"
              onClick={(e) => {
                console.log("Create Request button clicked directly");
                e.preventDefault();
                handleCreateRequest(e);
              }}
            >
              Add Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Confirm Deletion"
        size="small"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-[#e8eaed]">
                Delete {deleteTarget?.type === 'collection' ? 'Collection' : 'Request'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-[#9aa0a6] mt-1">
                {deleteTarget?.type === 'collection' 
                  ? `Are you sure you want to delete the collection "${deleteTarget.name}"? This will also delete all requests in this collection.`
                  : `Are you sure you want to delete the request "${deleteTarget?.name}"?`
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="flex-1 h-10 border-slate-300 dark:border-[#404040] hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-[#e8eaed]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all"
            >
              Delete {deleteTarget?.type === 'collection' ? 'Collection' : 'Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}