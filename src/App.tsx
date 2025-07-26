import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";

// 🎓 TEACHING: These TypeScript interfaces match our Rust structs
// They help us work with the data in a type-safe way
interface Collection {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface Request {
  id: string;
  collection_id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  body?: string;
  auth_type?: string;
  auth_data?: string;
  created_at: string;
  updated_at: string;
}

function App() {
  // 🎓 TEACHING: React state to manage our data and UI state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Form state for creating new collections
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  // Form state for creating new requests
  const [newRequestName, setNewRequestName] = useState("");
  const [newRequestMethod, setNewRequestMethod] = useState("GET");
  const [newRequestUrl, setNewRequestUrl] = useState("");

  // 🎓 TEACHING: Initialize database when component mounts
  useEffect(() => {
    initializeDatabase();
  }, []);

  // 🎓 TEACHING: This function calls our Rust backend to initialize the database
  const initializeDatabase = async () => {
    console.log("🚀 Initializing database from frontend...");
    try {
      const result = await invoke<string>("init_database");
      console.log("✅ Database result:", result);
      setIsDbInitialized(true);
      loadCollections(); // Load existing collections after DB init
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      setIsDbInitialized(false);
      // Show the error in the UI
      alert(`Database initialization failed: ${error}`);
    }
  };

  // 🎓 TEACHING: Load all collections from the database
  const loadCollections = async () => {
    console.log("📂 Loading collections...");
    try {
      const cols = await invoke<Collection[]>("get_collections");
      console.log("✅ Loaded collections:", cols);
      setCollections(cols);
    } catch (error) {
      console.error("❌ Failed to load collections:", error);
    }
  };

  // 🎓 TEACHING: Load requests for a specific collection
  const loadRequestsForCollection = async (collectionId: string) => {
    try {
      const reqs = await invoke<Request[]>("get_requests_by_collection", {
        collectionId,
      });
      setRequests(reqs);
      setSelectedCollection(collectionId);
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  // 🎓 TEACHING: Create a new collection
  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    console.log("➕ Creating collection:", newCollectionName);
    try {
      const result = await invoke("create_collection", {
        name: newCollectionName,
        description: newCollectionDescription || null,
        parentId: null,
      });
      console.log("✅ Collection created:", result);

      // Clear form and reload data
      setNewCollectionName("");
      setNewCollectionDescription("");
      loadCollections();
    } catch (error) {
      console.error("❌ Failed to create collection:", error);
      alert(`Failed to create collection: ${error}`);
    }
  };

  // 🎓 TEACHING: Create a new request
  const createRequest = async () => {
    if (!newRequestName.trim() || !newRequestUrl.trim() || !selectedCollection)
      return;

    try {
      await invoke("create_request", {
        collectionId: selectedCollection,
        name: newRequestName,
        method: newRequestMethod,
        url: newRequestUrl,
      });

      // Clear form and reload requests
      setNewRequestName("");
      setNewRequestUrl("");
      loadRequestsForCollection(selectedCollection);
    } catch (error) {
      console.error("Failed to create request:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">OpenRequest - Database Test</h1>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle>Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={isDbInitialized ? "default" : "destructive"}>
            {isDbInitialized
              ? "✅ Database Initialized"
              : "❌ Database Not Initialized"}
          </Badge>
        </CardContent>
      </Card>

      {/* Collections Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Collection */}
        <Card>
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
            <Button
              onClick={createCollection}
              disabled={!isDbInitialized || !newCollectionName.trim()}
            >
              Create Collection
            </Button>
          </CardContent>
        </Card>

        {/* View Collections */}
        <Card>
          <CardHeader>
            <CardTitle>Collections ({collections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                    selectedCollection === collection.id
                      ? "bg-blue-50 border-blue-300"
                      : ""
                  }`}
                  onClick={() => loadRequestsForCollection(collection.id)}
                >
                  <div className="font-medium">{collection.name}</div>
                  {collection.description && (
                    <div className="text-sm text-gray-600">
                      {collection.description}
                    </div>
                  )}
                </div>
              ))}
              {collections.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No collections yet. Create one above!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Section - Only show if a collection is selected */}
      {selectedCollection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Request */}
          <Card>
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
              </select>
              <Input
                placeholder="URL (e.g., https://api.example.com/users)"
                value={newRequestUrl}
                onChange={(e) => setNewRequestUrl(e.target.value)}
              />
              <Button
                onClick={createRequest}
                disabled={!newRequestName.trim() || !newRequestUrl.trim()}
              >
                Create Request
              </Button>
            </CardContent>
          </Card>

          {/* View Requests */}
          <Card>
            <CardHeader>
              <CardTitle>
                Requests in Selected Collection ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requests.map((request) => (
                  <div key={request.id} className="p-3 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{request.method}</Badge>
                      <div className="font-medium">{request.name}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {request.url}
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="text-gray-500 text-center py-4">
                    No requests in this collection yet. Create one above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default App;
