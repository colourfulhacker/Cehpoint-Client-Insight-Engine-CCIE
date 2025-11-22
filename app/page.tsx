"use client";

import { useState, useRef, useEffect } from "react";
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

interface Campaign {
  id: string;
  name: string;
  fileName: string;
  date: string;
  leadCount: number;
  report: ClientInsightReport;
  status: "completed" | "processing" | "failed";
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<string>("upload");
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
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProspectForRegeneration, setSelectedProspectForRegeneration] = useState<{ prospect: ProspectInsight; index: number } | null>(null);
  const [expandModalOpen, setExpandModalOpen] = useState(false);
  const [selectedPitchForExpansion, setSelectedPitchForExpansion] = useState<{ prospect: ProspectInsight; pitch: string } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load campaigns from localStorage on mount
  useEffect(() => {
    const savedCampaigns = localStorage.getItem("ccie_campaigns");
    if (savedCampaigns) {
      try {
        setCampaigns(JSON.parse(savedCampaigns));
      } catch (e) {
        // Failed to parse saved campaigns, reset to empty
        localStorage.removeItem("ccie_campaigns");
      }
    }
  }, []);

  // Save campaigns to localStorage whenever they change
  useEffect(() => {
    if (campaigns.length > 0) {
      localStorage.setItem("ccie_campaigns", JSON.stringify(campaigns));
    } else {
      localStorage.removeItem("ccie_campaigns");
    }
  }, [campaigns]);

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
      // Clipboard API failed, likely due to permissions or browser support
      setError('Unable to copy to clipboard. Please copy manually.');
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
              
              // Save campaign to history
              const newCampaign: Campaign = {
                id: `campaign-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                name: selectedFile?.name.replace(/\.(csv|xlsx|xls)$/i, "") || "Unnamed Campaign",
                fileName: selectedFile?.name || "Unknown file",
                date: new Date().toISOString(),
                leadCount: update.report.prospectInsights.length,
                report: update.report,
                status: "completed"
              };
              setCampaigns(prev => [newCampaign, ...prev]);
            }

            if (update.type === "error") {
              setApiError(`${update.message}. System will continue batch-wise processing.`);
              setIsStillProcessing(true);
            }
          } catch (parseError) {
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

  const copyTemplateToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplate(id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (err) {
      // Clipboard API not available, user can copy manually
      setError('Unable to copy to clipboard. Please copy the text manually.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between lg:ml-0 ml-12">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Prospect Intelligence</h1>
              <p className="text-sm text-gray-500 mt-1">Transform prospect data into actionable insights</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">
                Live
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {activeSection === 'upload' && (
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

              {/* Results Header with KPI Cards */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Analysis Results</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    {(insights?.prospectInsights || streamingInsights).length} prospect{(insights?.prospectInsights || streamingInsights).length !== 1 ? 's' : ''} analyzed with personalized insights
                  </p>
                </div>
                {insights && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-sm">
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Analysis Complete</p>
                      <p className="text-xs text-emerald-600">{insights.prospectInsights.length} prospects ready</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Grid - Modern Card Layout */}
              <div className="space-y-6">
                {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Premium Header */}
                    <div className="px-7 py-6 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1.5 bg-white/25 text-white rounded-full text-xs font-bold">
                              #{idx + 1}
                            </span>
                            <span className="px-3 py-1 bg-emerald-400/90 text-emerald-900 rounded-full text-xs font-bold">
                              Analyzed
                            </span>
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-2 leading-tight">
                            {prospect.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-bold text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                              </svg>
                              {prospect.role}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-sm font-bold text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6-4a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2V6z"></path>
                              </svg>
                              {prospect.company}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content - Premium Layout */}
                    <div className="px-7 py-8 space-y-7">

                      {/* Profile Intelligence Box */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 rounded-xl transition-all duration-300" />
                        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 0H4v2h12V5zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 0H4v2h12v-2z"></path>
                              </svg>
                            </div>
                            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Profile Intelligence</h4>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed font-medium">{prospect.profileNotes}</p>
                        </div>
                      </div>

                      {/* Pitch Suggestions - Premium Cards */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>
                              </svg>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                              Value Propositions
                            </h4>
                          </div>
                          <button
                            onClick={() => openRegenerateModal(prospect, idx)}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                            title="Generate new pitch variations"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Regenerate</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          {prospect.pitchSuggestions.map((pitch, pIdx) => {
                            const pitchId = `${idx}-${pIdx}`;
                            const isCopied = copiedPitch === pitchId;
                            
                            return (
                              <div
                                key={pIdx}
                                className="group/pitch relative p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300"
                              >
                                <div className="flex gap-4 pr-28">
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                                    {pIdx + 1}
                                  </div>
                                  <p className="text-sm text-gray-800 leading-relaxed font-medium pt-0.5">{pitch.pitch}</p>
                                </div>
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/pitch:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={() => openExpandModal(prospect, pitch.pitch)}
                                    className="px-3 py-2 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                                    title="Generate full pitch"
                                  >
                                    Expand
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(pitch.pitch, pitchId)}
                                    className="p-2 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all shadow-sm"
                                    title="Copy"
                                  >
                                    {isCopied ? (
                                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                      {/* Conversation Starter - Premium Style */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-5 rounded-xl transition-all duration-300" />
                        <div className="relative group/opener bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-amber-600 rounded-lg">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.414l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                              </svg>
                            </div>
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Opening Message
                            </p>
                          </div>
                          <p className="text-base text-gray-900 font-semibold italic leading-relaxed pl-8">&quot;{prospect.conversationStarter}&quot;</p>
                          <button
                            onClick={() => copyToClipboard(prospect.conversationStarter, `opener-${idx}`)}
                            className="absolute top-5 right-5 p-2 bg-white border border-amber-200 opacity-0 group-hover/opener:opacity-100 hover:bg-amber-50 rounded-lg transition-all shadow-sm hover:shadow-md"
                            title="Copy"
                          >
                            {copiedPitch === `opener-${idx}` ? (
                              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Templates Section */}
        {activeSection === 'templates' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Outreach Templates</h1>
              <p className="text-sm text-gray-600 mt-1">Professional messaging templates for your sales outreach</p>
            </div>

            {/* Template Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Templates */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Email Templates</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Cold outreach & follow-up emails</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      name: "Cold Outreach - Value First",
                      subject: "Quick idea for [Company]",
                      body: `Hi [Name],\n\nI noticed [Company] is [specific observation from their LinkedIn/website]. Many companies in [their industry] struggle with [common pain point].\n\nWe've helped similar companies like [relevant client] achieve [specific result]. I'd love to share a quick idea that could help [Company] [achieve similar outcome].\n\nWould you be open to a brief 15-minute call next week?\n\nBest regards,\n[Your Name]`
                    },
                    {
                      name: "Follow-Up - No Response",
                      subject: "Re: Quick idea for [Company]",
                      body: `Hi [Name],\n\nI wanted to follow up on my previous email. I know you're busy, so I'll keep this brief.\n\nI've put together a quick analysis of how [Company] could [specific benefit]. No strings attached - just wanted to share something that might be valuable.\n\nWould you like me to send it over?\n\nBest,\n[Your Name]`
                    },
                    {
                      name: "Introduction After Connection",
                      subject: "Great connecting with you, [Name]",
                      body: `Hi [Name],\n\nThanks for accepting my connection request! I'm impressed by your work at [Company], especially [specific achievement or project].\n\nI work with [your company/role], helping [target audience] with [value proposition]. I'd love to learn more about your current priorities at [Company].\n\nWould you be open to a quick virtual coffee chat?\n\nLooking forward to connecting,\n[Your Name]`
                    }
                  ].map((template, idx) => (
                    <div key={idx} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                        <button
                          onClick={() => copyTemplateToClipboard(`Subject: ${template.subject}\n\n${template.body}`, `email-${idx}`)}
                          className="p-1.5 bg-white border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                          title="Copy template"
                        >
                          {copiedTemplate === `email-${idx}` ? (
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
                      <p className="text-xs font-semibold text-blue-700 mb-2">Subject: {template.subject}</p>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* LinkedIn Templates */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">LinkedIn Messages</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Connection requests & InMails</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      name: "Connection Request - Personalized",
                      body: `Hi [Name],\n\nI came across your profile and was impressed by your work in [specific area/achievement]. I'm in [your role/industry] and would love to connect and exchange insights on [relevant topic].\n\nLooking forward to connecting!`
                    },
                    {
                      name: "InMail - Value Proposition",
                      body: `Hi [Name],\n\nI hope this message finds you well. I've been following [Company]'s growth in [industry/market] and wanted to reach out.\n\nWe work with [similar companies/roles] to [value proposition]. For example, we recently helped [client example] achieve [specific result].\n\nI'd love to explore if there's a fit for [Company]. Would you be open to a quick 15-minute call?\n\nBest regards,\n[Your Name]`
                    },
                    {
                      name: "Follow-Up After Connection",
                      body: `Hi [Name],\n\nThanks for connecting! I noticed you're working on [specific project/initiative]. I'd love to learn more about your goals and see if there's any way I can add value.\n\nWould you be open to a brief call next week?\n\nCheers,\n[Your Name]`
                    }
                  ].map((template, idx) => (
                    <div key={idx} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-purple-200 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                        <button
                          onClick={() => copyTemplateToClipboard(template.body, `linkedin-${idx}`)}
                          className="p-1.5 bg-white border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-purple-50 rounded-lg transition-all shadow-sm"
                          title="Copy template"
                        >
                          {copiedTemplate === `linkedin-${idx}` ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cold Call Scripts */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Cold Call Scripts</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Phone outreach frameworks</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      name: "Opening - Permission Based",
                      body: `Hi [Name], this is [Your Name] from [Company].\n\nI know I'm calling out of the blue - do you have 30 seconds for me to explain why I'm calling?\n\n[Wait for response]\n\nGreat! I've been working with [similar companies] to help them [value proposition]. I thought there might be an opportunity to do something similar for [their Company].\n\nDoes [pain point/challenge] sound familiar to you?`
                    },
                    {
                      name: "Handling Gatekeepers",
                      body: `Hi, this is [Your Name] calling from [Company]. Could you help me?\n\nI'm trying to reach the person who handles [responsibility/department]. Would that be [Name], or should I speak with someone else?\n\n[If asked what it's regarding]\n\nIt's regarding [brief value statement]. I wanted to share some insights that could help with [specific outcome].`
                    },
                    {
                      name: "Voicemail Script",
                      body: `Hi [Name], this is [Your Name] from [Company].\n\nI'm reaching out because we've been helping companies like [yours/competitor] with [specific challenge]. I have a quick idea that could help [Company] [achieve benefit].\n\nI'll send you a brief email with more details. My number is [XXX-XXX-XXXX] if you'd like to chat.\n\nThanks!`
                    }
                  ].map((template, idx) => (
                    <div key={idx} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-green-200 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                        <button
                          onClick={() => copyTemplateToClipboard(template.body, `call-${idx}`)}
                          className="p-1.5 bg-white border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-green-50 rounded-lg transition-all shadow-sm"
                          title="Copy script"
                        >
                          {copiedTemplate === `call-${idx}` ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Proposition Frameworks */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Value Frameworks</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Proven messaging structures</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      name: "Problem-Agitate-Solve (PAS)",
                      body: `PROBLEM: [Target audience] struggles with [specific pain point]\n\nAGITATE: This leads to [negative consequences] and costs [time/money/resources]\n\nSOLVE: Our [solution] helps you [achieve outcome] by [key differentiator]\n\nRESULT: Companies like [client example] achieved [specific measurable result]`
                    },
                    {
                      name: "Before-After-Bridge (BAB)",
                      body: `BEFORE: Right now, you're experiencing [current situation/pain]\n\nAFTER: Imagine if you could [desired outcome/benefit]\n\nBRIDGE: Here's how we help you get there:\n• [Key benefit 1]\n• [Key benefit 2]\n• [Key benefit 3]\n\nProof: [Client example + result]`
                    },
                    {
                      name: "Feature-Advantage-Benefit (FAB)",
                      body: `FEATURE: We offer [specific feature/capability]\n\nADVANTAGE: This means you can [what it enables]\n\nBENEFIT: So you'll achieve [business outcome]\n\nExample: [Real customer success story]`
                    }
                  ].map((template, idx) => (
                    <div key={idx} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900">{template.name}</h4>
                        <button
                          onClick={() => copyTemplateToClipboard(template.body, `framework-${idx}`)}
                          className="p-1.5 bg-white border border-gray-200 opacity-0 group-hover:opacity-100 hover:bg-orange-50 rounded-lg transition-all shadow-sm"
                          title="Copy framework"
                        >
                          {copiedTemplate === `framework-${idx}` ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{template.body}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">Pro Tips for Using Templates</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Always personalize templates with specific details about the prospect</li>
                    <li>Use insights from the AI analysis to customize your messaging</li>
                    <li>Test different templates and track which ones perform best</li>
                    <li>Keep messages concise - aim for under 150 words for cold outreach</li>
                    <li>Include a clear, single call-to-action in every message</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder sections for other navigation items */}
        {activeSection === 'dashboard' && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Coming Soon</h2>
            <p className="text-gray-600">Campaign analytics and performance metrics will appear here</p>
          </div>
        )}

        {activeSection === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campaign History</h1>
                <p className="text-sm text-gray-600 mt-1">View and manage your prospect analysis campaigns</p>
              </div>
              <button
                onClick={() => setActiveSection('upload')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-sm"
              >
                + New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">Upload your first prospect file to get started</p>
                <button
                  onClick={() => setActiveSection('upload')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create First Campaign
                </button>
              </div>
            ) : selectedCampaign ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h2>
                    <p className="text-sm text-gray-600">{selectedCampaign.leadCount} prospects • {new Date(selectedCampaign.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Prospect Insights</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadJSON(selectedCampaign.report)}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                      >
                        Export JSON
                      </button>
                      <button
                        onClick={() => downloadInsights(selectedCampaign.report)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Export TXT
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedCampaign.report.prospectInsights.map((prospect, idx) => (
                      <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{prospect.name}</h4>
                            <p className="text-sm text-gray-600">{prospect.role} at {prospect.company}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Analyzed
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{prospect.profileNotes}</p>
                        <div className="text-sm text-gray-600">
                          <strong>Opening:</strong> &quot;{prospect.conversationStarter}&quot;
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {campaign.fileName}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        <strong className="text-gray-900">{campaign.leadCount}</strong> leads
                      </span>
                      <span className="text-gray-500">
                        {new Date(campaign.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'learning' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
              <p className="text-sm text-gray-600 mt-1">Master sales intelligence and outreach strategies</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Getting Started */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Getting Started</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Quick start guides for new users</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: "Upload Your First Prospect File", desc: "Learn the required CSV/Excel format and data columns" },
                    { title: "Understanding AI Insights", desc: "How Gemini analyzes prospects and generates personalized pitches" },
                    { title: "Navigating the Platform", desc: "Tour of all features: Upload, Templates, Campaigns, Learning Hub" }
                  ].map((lesson, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{lesson.title}</h3>
                          <p className="text-xs text-gray-600">{lesson.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Best Practices</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Expert tips for successful outreach</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: "Personalization is Key", desc: "Use AI insights to customize every message for better response rates" },
                    { title: "Follow-Up Strategy", desc: "Best timing and frequency for follow-ups without being pushy" },
                    { title: "Multi-Channel Approach", desc: "Combine email, LinkedIn, and phone outreach effectively" }
                  ].map((tip, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</h3>
                          <p className="text-xs text-gray-600">{tip.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cehpoint Expertise - Full Width */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden lg:col-span-2">
                <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Cehpoint Platform Overview</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Complete technical capabilities and service strengths</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Custom Software Development */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs">1</span>
                        Custom Software Development
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">Frontend:</p>
                          <p className="text-gray-600">React.js, Next.js, Vue.js, TailwindCSS</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">Backend:</p>
                          <p className="text-gray-600">Node.js, Python, PHP, Golang APIs</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">Mobile:</p>
                          <p className="text-gray-600">Flutter, React Native, Android</p>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <p className="font-semibold text-blue-700 text-xs">Value: Scalable architecture, fast delivery</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Cybersecurity Services */}
                    <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-red-600 text-white rounded flex items-center justify-center text-xs">2</span>
                        Cybersecurity Services
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Testing:</p>
                          <p className="text-gray-600">Penetration Testing, VAPT, Code Review</p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Incident Response:</p>
                          <p className="text-gray-600">Breach detection, forensics, malware analysis</p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Compliance:</p>
                          <p className="text-gray-600">SOC 2, ISO 27001, HIPAA, GDPR</p>
                        </div>
                        <div className="pt-2 border-t border-red-200">
                          <p className="font-semibold text-red-700 text-xs">Value: End-to-end protection, rapid response</p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Automation & Process Engineering */}
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-amber-600 text-white rounded flex items-center justify-center text-xs">3</span>
                        Automation & Process Engineering
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">BPA:</p>
                          <p className="text-gray-600">ERP, HR, payroll, finance workflows</p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">RPA:</p>
                          <p className="text-gray-600">UI automation, bot execution</p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900 mb-1">Tools:</p>
                          <p className="text-gray-600">Zapier, Make.com, N8N, API triggers</p>
                        </div>
                        <div className="pt-2 border-t border-amber-200">
                          <p className="font-semibold text-amber-700 text-xs">Value: Reduced overhead, higher accuracy</p>
                        </div>
                      </div>
                    </div>

                    {/* 4. AI, ML & Intelligent Systems */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-600 text-white rounded flex items-center justify-center text-xs">4</span>
                        AI, ML & Intelligent Systems
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-purple-900 mb-1">AI Integration:</p>
                          <p className="text-gray-600">Chatbots, support agents, lead scoring</p>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900 mb-1">Custom LLMs:</p>
                          <p className="text-gray-600">Gemini, document intelligence, voice AI</p>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900 mb-1">ML Engineering:</p>
                          <p className="text-gray-600">Predictive modeling, NLP, classification</p>
                        </div>
                        <div className="pt-2 border-t border-purple-200">
                          <p className="font-semibold text-purple-700 text-xs">Value: Smart automation, better decisions</p>
                        </div>
                      </div>
                    </div>

                    {/* 5. DevOps, CI/CD & Cloud Systems */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center text-xs">5</span>
                        DevOps, CI/CD & Cloud
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-green-900 mb-1">DevOps:</p>
                          <p className="text-gray-600">CI/CD pipelines, Docker, Kubernetes</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 mb-1">Cloud (GCP):</p>
                          <p className="text-gray-600">VM, Functions, Firestore, Load Balancers</p>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 mb-1">Monitoring:</p>
                          <p className="text-gray-600">Prometheus, Grafana, Sentry, ELK</p>
                        </div>
                        <div className="pt-2 border-t border-green-200">
                          <p className="font-semibold text-green-700 text-xs">Value: Zero downtime, fast cycles</p>
                        </div>
                      </div>
                    </div>

                    {/* 6. Enterprise IT & Digital Infrastructure */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-xs">6</span>
                        Enterprise IT & Infrastructure
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-indigo-900 mb-1">Infrastructure:</p>
                          <p className="text-gray-600">Server setup, network architecture, firewalls</p>
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-900 mb-1">Security:</p>
                          <p className="text-gray-600">VPN, secure remote access</p>
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-900 mb-1">Disaster Recovery:</p>
                          <p className="text-gray-600">Backup automation, failover strategy</p>
                        </div>
                        <div className="pt-2 border-t border-indigo-200">
                          <p className="font-semibold text-indigo-700 text-xs">Value: Reliable continuity, professional IT</p>
                        </div>
                      </div>
                    </div>

                    {/* 7. SaaS & Product Engineering */}
                    <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-teal-600 text-white rounded flex items-center justify-center text-xs">7</span>
                        SaaS & Product Engineering
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-teal-900 mb-1">Product Development:</p>
                          <p className="text-gray-600">Multi-tenant SaaS, billing integration</p>
                        </div>
                        <div>
                          <p className="font-semibold text-teal-900 mb-1">API Development:</p>
                          <p className="text-gray-600">RESTful, GraphQL, 3rd-party integrations</p>
                        </div>
                        <div>
                          <p className="font-semibold text-teal-900 mb-1">Dashboards:</p>
                          <p className="text-gray-600">Custom analytics and reporting</p>
                        </div>
                        <div className="pt-2 border-t border-teal-200">
                          <p className="font-semibold text-teal-700 text-xs">Value: End-to-end execution, scalability</p>
                        </div>
                      </div>
                    </div>

                    {/* 8. Website & Digital Experience */}
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-pink-600 text-white rounded flex items-center justify-center text-xs">8</span>
                        Website & Digital Experience
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-pink-900 mb-1">Services:</p>
                          <p className="text-gray-600">Corporate sites, landing pages, e-commerce</p>
                        </div>
                        <div>
                          <p className="font-semibold text-pink-900 mb-1">Technology:</p>
                          <p className="text-gray-600">Next.js high-speed websites</p>
                        </div>
                        <div>
                          <p className="font-semibold text-pink-900 mb-1">Optimization:</p>
                          <p className="text-gray-600">SEO, page speed, conversion-focused UI</p>
                        </div>
                        <div className="pt-2 border-t border-pink-200">
                          <p className="font-semibold text-pink-700 text-xs">Value: Professional brand, high performance</p>
                        </div>
                      </div>
                    </div>

                    {/* 9. CRM & Sales Automation */}
                    <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-violet-600 text-white rounded flex items-center justify-center text-xs">9</span>
                        CRM & Sales Automation
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-violet-900 mb-1">CRM Platforms:</p>
                          <p className="text-gray-600">Zoho, HubSpot, Salesforce customization</p>
                        </div>
                        <div>
                          <p className="font-semibold text-violet-900 mb-1">Sales Automation:</p>
                          <p className="text-gray-600">Outreach automation, lead enrichment</p>
                        </div>
                        <div>
                          <p className="font-semibold text-violet-900 mb-1">Email Systems:</p>
                          <p className="text-gray-600">Sequencing systems, tracking</p>
                        </div>
                        <div className="pt-2 border-t border-violet-200">
                          <p className="font-semibold text-violet-700 text-xs">Value: Faster leads, higher conversions</p>
                        </div>
                      </div>
                    </div>

                    {/* 10. Legacy System Modernization */}
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-slate-100">
                      <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-600 text-white rounded flex items-center justify-center text-xs">10</span>
                        Legacy System Modernization
                      </h3>
                      <div className="space-y-2 text-xs text-gray-700">
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">Modernization:</p>
                          <p className="text-gray-600">Old apps to modern stacks</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">Migration:</p>
                          <p className="text-gray-600">PHP monoliths to modern frameworks</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">Refactoring:</p>
                          <p className="text-gray-600">React to Next.js, API improvements</p>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <p className="font-semibold text-slate-700 text-xs">Value: Reduced debt, better performance</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Techniques */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Advanced Techniques</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Level up your sales game</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { title: "Account-Based Marketing", desc: "Target high-value accounts with coordinated campaigns" },
                    { title: "Social Selling Strategies", desc: "Build relationships through LinkedIn engagement and content" },
                    { title: "Data-Driven Prospecting", desc: "Use analytics to identify your ideal customer profile" }
                  ].map((technique, i) => (
                    <div key={i} className="p-4 border border-orange-200 rounded-lg hover:border-orange-400 transition-colors">
                      <div className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded text-orange-700 font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{technique.title}</h3>
                          <p className="text-xs text-gray-600">{technique.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Configure your workspace and integrations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Configuration */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">API Integrations</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Manage your API keys</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Gemini API Key
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">Configured ✓</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Your Gemini API key is securely configured via Replit Secrets
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value="••••••••••••••••••••••••"
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        Update
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Optional Integrations</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email Finder API</p>
                          <p className="text-xs text-gray-600">Find prospect email addresses</p>
                        </div>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Not configured</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Domain Lookup API</p>
                          <p className="text-xs text-gray-600">Company website enrichment</p>
                        </div>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Not configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Settings */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">General Settings</h2>
                      <p className="text-sm text-gray-600 mt-0.5">Workspace preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Export Format
                    </label>
                    <select 
                      defaultValue="JSON (Recommended)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option>JSON (Recommended)</option>
                      <option>Text (.txt)</option>
                      <option>CSV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Batch Size
                    </label>
                    <select 
                      defaultValue="10 prospects (Balanced)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option>5 prospects (Faster)</option>
                      <option>10 prospects (Balanced)</option>
                      <option>15 prospects (Slower)</option>
                    </select>
                    <p className="text-xs text-gray-600 mt-1">Larger batches may take longer but use fewer API calls</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Data Management</h3>
                    <button
                      onClick={() => {
                        if (confirm("Clear all campaign history? This cannot be undone.")) {
                          localStorage.removeItem("ccie_campaigns");
                          setCampaigns([]);
                          alert("Campaign history cleared successfully");
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-200"
                    >
                      Clear All Campaign History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'help' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-sm text-gray-600 mt-1">Get assistance and find answers to common questions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* FAQ */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-lg shadow-sm">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h2>
                        <p className="text-sm text-gray-600 mt-0.5">Quick answers to common questions</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      {
                        q: "What file format should I upload?",
                        a: "Upload CSV or Excel files (.csv, .xlsx, .xls) with columns for Name, Role, and Company. Optional columns: location, description, profile, work_positions, education."
                      },
                      {
                        q: "How does the AI analyze prospects?",
                        a: "Our platform uses Google Gemini AI to analyze prospect profiles, identify pain points, and generate personalized pitch suggestions and conversation starters tailored to each prospect."
                      },
                      {
                        q: "Can I edit or regenerate pitches?",
                        a: "Yes! Click 'Regenerate Pitch' on any insight card to create new variations with different tones, or use 'Expand Pitch' to get longer versions for email templates."
                      },
                      {
                        q: "How is my data stored?",
                        a: "Campaign history is saved in your browser's local storage for quick access. Your data never leaves your browser except for AI analysis via secure API calls."
                      },
                      {
                        q: "What's the best way to use Templates?",
                        a: "Use templates as starting points, then personalize them with the AI-generated insights for each prospect. Combine multiple templates for different outreach channels."
                      },
                      {
                        q: "How many prospects can I analyze at once?",
                        a: "There's no hard limit, but larger files process in batches of 5-10 prospects. You can download partial results while processing continues."
                      }
                    ].map((faq, i) => (
                      <details key={i} className="group">
                        <summary className="cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors list-none">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 text-sm">{faq.q}</h3>
                            <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </summary>
                        <div className="p-4 text-sm text-gray-700 bg-white rounded-b-lg border-l-4 border-blue-500">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-sm flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Support
                    </button>
                    <button className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700">
                      Report an Issue
                    </button>
                    <button className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-gray-700">
                      Feature Request
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">System Status</h3>
                      <p className="text-xs text-green-600">All systems operational</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Gemini AI API</span>
                      <span className="text-green-600 font-medium">✓ Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File Processing</span>
                      <span className="text-green-600 font-medium">✓ Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Services</span>
                      <span className="text-green-600 font-medium">✓ Online</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">Need More Help?</h3>
                  <p className="text-xs text-gray-700 mb-4">
                    Our support team is here to assist you with any questions or issues.
                  </p>
                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      support@cehpoint.com
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mon-Fri, 9AM-6PM EST
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
