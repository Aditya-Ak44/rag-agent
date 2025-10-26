"use client";

import { useState, useEffect } from "react";
import { Upload, Database, Plus, Trash2, FileText, AlertCircle } from "lucide-react";

interface VectorStore {
  id: string;
  name: string;
  embeddingModel: string;
  fileCount: number;
  createdAt: string;
  status: "ready" | "processing";
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function Home() {
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [embeddingModel, setEmbeddingModel] = useState("all-minilm:latest");
  const [storeName, setStoreName] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "query">("create");
  const [query, setQuery] = useState("");
  const [queryResults, setQueryResults] = useState("");
  const [querying, setQuerying] = useState(false);

  // Fetch vector stores on mount
  useEffect(() => {
    fetchVectorStores();
  }, []);

  const fetchVectorStores = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/vector-stores");
      const data: APIResponse<VectorStore[]> = await res.json();
      if (data.success && data.data) {
        setVectorStores(data.data);
      }
    } catch (err) {
      setError("Failed to fetch vector stores");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setError("Please select PDF files");
      return;
    }

    if (!storeName.trim()) {
      setError("Please enter a store name");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("storeName", storeName);
      formData.append("embeddingModel", embeddingModel);

      const res = await fetch("/api/create-store", {
        method: "POST",
        body: formData,
      });

      const data: APIResponse<VectorStore> = await res.json();

      if (data.success) {
        setSuccess(`Vector store "${storeName}" created successfully!`);
        setStoreName("");
        setFiles(null);
        setEmbeddingModel("all-MiniLM-L6-v2");
        await fetchVectorStores();
      } else {
        setError(data.error || "Failed to create vector store");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm("Are you sure you want to delete this vector store?")) return;

    try {
      const res = await fetch(`/api/vector-stores/${storeId}`, {
        method: "DELETE",
      });

      const data: APIResponse<void> = await res.json();

      if (data.success) {
        setSuccess("Vector store deleted successfully!");
        setSelectedStore("");
        await fetchVectorStores();
      } else {
        setError(data.error || "Failed to delete vector store");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      setError("Please select a vector store");
      return;
    }

    if (!query.trim()) {
      setError("Please enter a query");
      return;
    }

    try {
      setQuerying(true);
      setError("");
      setQueryResults("");

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStore,
          query: query,
          topK: 3,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setQueryResults(data.data.answer);
      } else {
        setError(data.error || "Failed to query");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">RAG Vector DB Manager</h1>
          </div>
          <p className="text-slate-400">Create vector stores from PDFs and query with LLM</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-950/50 border border-green-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vector Stores List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Vector Stores
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-700/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : vectorStores.length === 0 ? (
                <p className="text-slate-400 text-sm">No vector stores yet. Create one!</p>
              ) : (
                <div className="space-y-2">
                  {vectorStores.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStore(store.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedStore === store.id
                          ? "bg-blue-600/40 border border-blue-500"
                          : "bg-slate-700/30 border border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm truncate">{store.name}</p>
                          <p className="text-xs text-slate-400">{store.embeddingModel}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStore(store.id);
                          }}
                          className="text-slate-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>{store.fileCount} files</span>
                        <span
                          className={`px-2 py-1 rounded ${
                            store.status === "ready"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {store.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            {/* Tab Buttons */}
            <div className="flex gap-4 mb-6 border-b border-slate-700">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === "create"
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Store
              </button>
              <button
                onClick={() => setActiveTab("query")}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === "query"
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Query
              </button>
            </div>

            {/* Create Store Tab */}
            {activeTab === "create" && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Create New Vector Store</h3>

                <form onSubmit={handleCreateStore} className="space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g., My Company Docs"
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Embedding Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Embedding Model (HuggingFace)
                    </label>
                    <select
                      value={embeddingModel}
                      onChange={(e) => setEmbeddingModel(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="all-minilm:latest">
                        all-minilm:latest(Fast, 384-dim)
                      </option>
                      <option value="mxbai-embed-large:latest ">
                        mxbai-embed-large:latest  (Better quality, 768-dim)
                      </option>
                      <option value="nomic-embed-text">
                        nomic-embed-text:latest 
                      </option>
                    </select>
                    <p className="text-xs text-slate-400 mt-2">
                      Larger models offer better semantic understanding but are slower
                    </p>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      PDF Files
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="px-4 py-6 border-2 border-dashed border-slate-600 rounded-lg text-center hover:border-blue-400 transition">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-300">
                          {files ? `${files.length} file(s) selected` : "Click to select PDFs"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                  >
                    {uploading ? "Creating Store..." : "Create Vector Store"}
                  </button>
                </form>
              </div>
            )}

            {/* Query Tab */}
            {activeTab === "query" && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Query Vector Store</h3>

                {selectedStore === "" ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">Select a vector store from the left panel</p>
                  </div>
                ) : (
                  <form onSubmit={handleQuery} className="space-y-6">
                    {/* Query Input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything about your documents..."
                        rows={4}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={querying}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                    >
                      {querying ? "Querying..." : "Get Answer"}
                    </button>

                    {/* Results */}
                    {queryResults && (
                      <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                        <p className="text-sm text-slate-300 mb-2 font-medium">Answer:</p>
                        <p className="text-white text-sm leading-relaxed">{queryResults}</p>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}