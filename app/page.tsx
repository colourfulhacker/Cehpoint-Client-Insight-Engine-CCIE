"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientInsightReport, ProspectInsight } from "@/lib/types";
import Logo from "./components/Logo";

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
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
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

  const regeneratePitches = async (prospect: ProspectInsight, index: number) => {
    setRegeneratingIndex(index);
    try {
      const response = await fetch("/api/regenerate-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: prospect.name,
          role: prospect.role,
          company: prospect.company,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate pitches");
      }

      const updatedProspect: ProspectInsight = await response.json();

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
    } catch (err) {
      console.error("Failed to regenerate pitches:", err);
      alert("Failed to regenerate pitches. Please try again.");
    } finally {
      setRegeneratingIndex(null);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze file");
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
          } catch {
            // Continue parsing
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!insights && streamingInsights.length === 0 ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
                  Prospect Intelligence
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Upload your prospect data to generate personalized sales insights and pitches powered by AI
                </p>
              </div>

              {/* Upload Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-900">
                      Upload File
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
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-900">
                      Required Columns
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { col: "Name", options: ["name", "full_name"] },
                        { col: "Role", options: ["role", "title"] },
                        { col: "Company", options: ["company", "org"] }
                      ].map((req, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <p className="font-medium text-gray-900 text-sm mb-2">{req.col}</p>
                          <div className="space-y-1.5">
                            {req.options.map((opt, i) => (
                              <div key={i}>
                                <code className="block px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 font-mono">
                                  {opt}
                                </code>
                                {i === 0 && <p className="text-center text-xs text-gray-400 py-0.5">or</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-gray-500">
                      Optional: location, description, profile
                    </p>
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
                    className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze Prospects"
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
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Analyzing Prospects
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {totalProcessed} of {totalInFile} prospects • {streamingProgress}%
                      </p>
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {streamingProgress}%
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${streamingProgress}%` }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-3">{streamingMessage}</p>
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Analysis Complete
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Generated insights for {insights.prospectInsights.length} prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadInsights()}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                    >
                      Download Text
                    </button>
                    <button
                      onClick={() => downloadJSON()}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                    >
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
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                    >
                      New Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Insights
                </h2>
                {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="mb-5 pb-5 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {prospect.name}
                      </h3>
                      <p className="text-sm text-gray-600">{prospect.role}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{prospect.company}</p>
                    </div>

                    {/* Profile Notes */}
                    <div className="mb-5">
                      <p className="text-sm text-gray-700 leading-relaxed">{prospect.profileNotes}</p>
                    </div>

                    {/* Pitch Suggestions */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          Pitch Suggestions
                        </h4>
                        <button
                          onClick={() => regeneratePitches(prospect, idx)}
                          disabled={regeneratingIndex === idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Generate new pitch variations"
                        >
                          {regeneratingIndex === idx ? (
                            <>
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Regenerate</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {prospect.pitchSuggestions.map((pitch, pIdx) => {
                          const pitchId = `${idx}-${pIdx}`;
                          const isCopied = copiedPitch === pitchId;
                          
                          return (
                            <div
                              key={pIdx}
                              className="group relative p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex gap-2 pr-8">
                                <span className="text-sm font-medium text-gray-500 flex-shrink-0">{pIdx + 1}.</span>
                                <p className="text-sm text-gray-700">{pitch.pitch}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(pitch.pitch, pitchId)}
                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white rounded transition-all"
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
                          );
                        })}
                      </div>
                    </div>

                    {/* Conversation Starter */}
                    <div className="group relative bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-2">
                        Opening Message
                      </p>
                      <p className="text-sm text-gray-800 italic pr-8">"{prospect.conversationStarter}"</p>
                      <button
                        onClick={() => copyToClipboard(prospect.conversationStarter, `opener-${idx}`)}
                        className="absolute top-3 right-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white rounded transition-all"
                        title="Copy"
                      >
                        {copiedPitch === `opener-${idx}` ? (
                          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Cehpoint. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
