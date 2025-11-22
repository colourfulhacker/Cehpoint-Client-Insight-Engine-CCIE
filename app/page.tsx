"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientInsightReport, ProspectInsight } from "@/lib/types";
import Sidebar from "./components/Sidebar";
import RegeneratePitchModal from "./components/RegeneratePitchModal";
import ExpandPitchModal from "./components/ExpandPitchModal";

interface BatchUpdate {
  type: string;
  batchNumber?: number;
  totalBatches?: number;
  batches?: number;
  prospects?: ProspectInsight[];
  progress?: number;
  message?: string;
  report?: ClientInsightReport;
  currentReport?: ClientInsightReport;
  totalProcessed?: number;
  totalInFile?: number;
  isProcessing?: boolean;
  canRetry?: boolean;
}

export default function HomePage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClientInsightReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamingInsights, setStreamingInsights] = useState<ProspectInsight[]>([]);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [totalInFile, setTotalInFile] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [availableForExport, setAvailableForExport] = useState<ClientInsightReport | null>(null);
  const [isStillProcessing, setIsStillProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProspectForRegeneration, setSelectedProspectForRegeneration] = useState<{ prospect: ProspectInsight; index: number } | null>(null);
  const [expandModalOpen, setExpandModalOpen] = useState(false);
  const [selectedPitchForExpansion, setSelectedPitchForExpansion] = useState<{ prospect: ProspectInsight; pitch: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setApiError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setError(null);
      setApiError(null);
      
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    } else {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPitch(id);
      setTimeout(() => setCopiedPitch(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openRegenerateModal = (prospect: ProspectInsight, index: number) => {
    setSelectedProspectForRegeneration({ prospect, index });
    setModalOpen(true);
  };

  const closeRegenerateModal = () => {
    setModalOpen(false);
    setSelectedProspectForRegeneration(null);
  };

  const openExpandModal = (prospect: ProspectInsight, pitch: string) => {
    setSelectedPitchForExpansion({ prospect, pitch });
    setExpandModalOpen(true);
  };

  const closeExpandModal = () => {
    setExpandModalOpen(false);
    setSelectedPitchForExpansion(null);
  };

  const handleProspectUpdate = (updatedProspect: ProspectInsight) => {
    if (!selectedProspectForRegeneration) return;
    
    const index = selectedProspectForRegeneration.index;

    // Update the prospect in both insights and streaming insights
    if (insights) {
      const updatedInsights = { ...insights };
      updatedInsights.prospectInsights[index] = updatedProspect;
      setInsights(updatedInsights);
    }

    if (streamingInsights.length > 0) {
      const updatedStreamingInsights = [...streamingInsights];
      updatedStreamingInsights[index] = updatedProspect;
      setStreamingInsights(updatedStreamingInsights);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setApiError(null);
    setStreamingInsights([]);
    setStreamingProgress(0);
    setStreamingMessage("");
    setTotalInFile(0);
    setTotalProcessed(0);
    setAvailableForExport(null);
    setIsStillProcessing(false);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Failed to analyze file";
        
        try {
          if (contentType && contentType.startsWith("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText.trim().startsWith('<') || errorText.trim().startsWith('<!DOCTYPE')) {
              errorMessage = "API Configuration Error: The server returned an HTML error page. Please check your Gemini API key configuration.";
            } else {
              errorMessage = errorText.substring(0, 200) || errorMessage;
            }
          }
        } catch (parseError) {
          errorMessage = "Server Error: Unable to process error response from the server.";
        }
        
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let hasReceivedData = false;

      const timeout = setTimeout(() => {
        if (!hasReceivedData) {
          setApiError("API Response Delayed: Analyzing prospects in batches. You can download partial results.");
        }
      }, 5000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        hasReceivedData = true;
        clearTimeout(timeout);
        setApiError(null);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          // Check if the response is HTML instead of JSON
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('<') || trimmedLine.startsWith('<!DOCTYPE')) {
            console.error("Received HTML response instead of JSON:", trimmedLine.substring(0, 100));
            setApiError("API Configuration Error: The server returned an unexpected response. Please check your API key configuration or contact support.");
            setIsPending(false);
            break; // Exit loop immediately to prevent repeated errors
          }

          try {
            const update: BatchUpdate = JSON.parse(line);

            if (update.type === "status") {
              setStreamingMessage(update.message || "Starting analysis...");
              setTotalInFile(update.totalInFile || 0);
            }

            if (update.type === "batch" && update.prospects) {
              setStreamingInsights(prev => [...prev, ...update.prospects!]);
              const processed = update.totalProcessed || 0;
              const total = update.totalInFile || 0;
              setTotalProcessed(processed);
              setTotalInFile(total);
              const progressPercent = total 
                ? Math.round((processed / total) * 100) 
                : 0;
              setStreamingProgress(progressPercent);
              setIsStillProcessing(update.isProcessing === true);
            }

            if (update.type === "batch_complete_available" && update.currentReport) {
              setAvailableForExport(update.currentReport);
              const processed = update.totalProcessed || 0;
              const total = update.totalInFile || 0;
              setTotalProcessed(processed);
              setTotalInFile(total);
              setStreamingMessage(update.message || "Processing more data...");
              setIsStillProcessing(update.isProcessing === true);
              const progressPercent = total 
                ? Math.round((processed / total) * 100) 
                : 0;
              setStreamingProgress(progressPercent);
            }

            if (update.type === "complete" && update.report) {
              setInsights(update.report);
              setStreamingProgress(100);
              setStreamingMessage("Analysis complete");
              setIsStillProcessing(false);
              setIsPending(false);
            }

            if (update.type === "error") {
              console.error("API Error:", update.message);
              setApiError(`${update.message}. System will continue batch-wise processing.`);
              setIsStillProcessing(true);
            }
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Line:", trimmedLine.substring(0, 100));
            setApiError("Data Processing Error: Unable to parse server response. The analysis may continue with partial results.");
          }
        }
      }

      clearTimeout(timeout);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setError(errorMsg);
      setApiError(`Connection Issue: ${errorMsg}. You can download any partial results.`);
      setIsPending(false);
    }
  };

  const downloadInsights = (report: ClientInsightReport | null = null) => {
    const dataToExport = report || insights;
    if (!dataToExport) return;
    
    const text = dataToExport.prospectInsights
      .map(p => `${p.name} (${p.role})\n${p.profileNotes}\n\nPitches:\n${p.pitchSuggestions.map((s, i) => `${i + 1}. ${s.pitch}`).join("\n")}\n\nOpening:\n"${p.conversationStarter}"\n`)
      .join("\n---\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cehpoint-insights-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (report: ClientInsightReport | null = null) => {
    const dataToExport = report || insights;
    if (!dataToExport) return;
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cehpoint-insights-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Prospect Intelligence</h1>
              <p className="text-sm text-gray-500 mt-1">Transform prospect data into actionable insights</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">
                Live
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
        <AnimatePresence mode="wait">
          {!insights && streamingInsights.length === 0 ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >

              {/* Upload Form */}
              <div className="max-w-4xl bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Card Header */}
                <div className="px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload Prospect Data</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Import your LinkedIn export or prospect list</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* File Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900">
                      Select File
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file"
                      name="file"
                      accept=".xlsx,.xls,.csv"
                      required
                      disabled={isPending}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <label
                      htmlFor="file"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : selectedFile
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-300 hover:border-gray-400 bg-gray-50"
                      }`}
                    >
                      <svg className={`w-10 h-10 mb-3 ${selectedFile ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      
                      {selectedFile ? (
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-medium text-gray-700">
                            {isDragging ? "Drop file here" : "Click to upload or drag and drop"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Excel or CSV • Max 10 MB</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Required Columns */}
                  <div className="space-y-3 bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900">
                      Required Data Columns
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { col: "Name", options: ["name", "full_name"], icon: "👤" },
                        { col: "Role", options: ["role", "title"], icon: "💼" },
                        { col: "Company", options: ["company", "org"], icon: "🏢" }
                      ].map((req, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className="text-lg">{req.icon}</span>
                            <p className="font-semibold text-gray-900 text-sm">{req.col}</p>
                          </div>
                          <div className="space-y-1.5">
                            {req.options.map((opt, i) => (
                              <div key={i}>
                                <code className="block px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 font-mono">
                                  {opt}
                                </code>
                                {i === 0 && <p className="text-center text-xs text-gray-400 py-1">or</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-blue-700">
                        <span className="font-semibold">Optional columns:</span> location, description, profile, work_positions, education
                      </p>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending || !selectedFile}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Prospects...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Insights
                      </span>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* API Error */}
              {apiError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{apiError}</p>
                </div>
              )}

              {/* Progress */}
              {!insights && streamingInsights.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">
                            Analyzing Prospects
                          </h2>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {totalProcessed} of {totalInFile} completed
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-white rounded-lg border border-blue-200">
                        <span className="text-2xl font-bold text-blue-600">{streamingProgress}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${streamingProgress}%` }}
                      />
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse opacity-50"
                        style={{ width: `${streamingProgress}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-4 font-medium">{streamingMessage}</p>
                  </div>
                </div>
              )}

              {/* Export Available */}
              {availableForExport && isStillProcessing && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {totalProcessed} Prospects Ready
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Download insights while we continue processing the remaining {totalInFile - totalProcessed} prospects.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadInsights(availableForExport)}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
                    >
                      Download Text
                    </button>
                    <button
                      onClick={() => downloadJSON(availableForExport)}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>
              )}

              {/* Completion */}
              {insights && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 mb-1">
                        Analysis Complete
                      </h2>
                      <p className="text-sm text-gray-700 mb-4">
                        Generated actionable insights for {insights.prospectInsights.length} prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => downloadInsights()}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Text
                        </button>
                        <button
                          onClick={() => downloadJSON()}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                          Download JSON
                        </button>
                        <button
                          onClick={() => {
                            setInsights(null);
                            setStreamingInsights([]);
                            setSelectedFile(null);
                            setAvailableForExport(null);
                            setApiError(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          New Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Prospect Insights</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {(insights?.prospectInsights || streamingInsights).length} prospect{(insights?.prospectInsights || streamingInsights).length !== 1 ? 's' : ''} analyzed
                  </p>
                </div>
                {insights && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold text-emerald-700">Complete</span>
                  </div>
                )}
              </div>

              {/* Results Grid */}
              <div className="space-y-5">
                {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {prospect.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {prospect.role}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {prospect.company}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="px-3 py-1.5 bg-blue-100 rounded-full">
                            <span className="text-xs font-bold text-blue-700">#{idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-5">

                      {/* Profile Notes */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Profile Intelligence</h4>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{prospect.profileNotes}</p>
                      </div>

                      {/* Pitch Suggestions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h4 className="text-sm font-bold text-gray-900">
                              Value Propositions
                            </h4>
                          </div>
                          <button
                            onClick={() => openRegenerateModal(prospect, idx)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Generate new pitch variations"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Regenerate</span>
                          </button>
                        </div>
                        <div className="space-y-2.5">
                          {prospect.pitchSuggestions.map((pitch, pIdx) => {
                            const pitchId = `${idx}-${pIdx}`;
                            const isCopied = copiedPitch === pitchId;
                            
                            return (
                              <div
                                key={pIdx}
                                className="group relative p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-200 transition-all"
                              >
                                <div className="flex gap-3 pr-24">
                                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">{pIdx + 1}</span>
                                  </div>
                                  <p className="text-sm text-gray-800 leading-relaxed">{pitch.pitch}</p>
                                </div>
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openExpandModal(prospect, pitch.pitch)}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                                    title="Generate full pitch"
                                  >
                                    Expand
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(pitch.pitch, pitchId)}
                                    className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all shadow-sm"
                                    title="Copy"
                                  >
                                    {isCopied ? (
                                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conversation Starter */}
                      <div className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                            Opening Message
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 font-medium italic pr-10 leading-relaxed">&quot;{prospect.conversationStarter}&quot;</p>
                        <button
                          onClick={() => copyToClipboard(prospect.conversationStarter, `opener-${idx}`)}
                          className="absolute top-4 right-4 p-1.5 bg-white border border-blue-200 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                          title="Copy"
                        >
                          {copiedPitch === `opener-${idx}` ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Regenerate Pitch Modal */}
      {selectedProspectForRegeneration && (
        <RegeneratePitchModal
          isOpen={modalOpen}
          onClose={closeRegenerateModal}
          prospect={selectedProspectForRegeneration.prospect}
          onRegenerate={handleProspectUpdate}
        />
      )}

      {/* Expand Pitch Modal */}
      {selectedPitchForExpansion && (
        <ExpandPitchModal
          isOpen={expandModalOpen}
          onClose={closeExpandModal}
          prospect={selectedPitchForExpansion.prospect}
          shortPitch={selectedPitchForExpansion.pitch}
        />
      )}
    </div>
  );
}
