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
          setApiError("⚠️ API Response Delayed: Analyzing prospects in batches. If processing takes too long, check API status. You can still download partial results.");
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
              setStreamingMessage("✓ Analysis complete!");
              setIsStillProcessing(false);
              setIsPending(false);
            }

            if (update.type === "error") {
              console.error("API Error:", update.message);
              setApiError(`⚠️ ${update.message}. System will continue batch-wise processing. You can download available insights.`);
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
      setApiError(`⚠️ Connection Issue: ${errorMsg}. You can still download any partial results that were processed.`);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-4 -left-4 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-xl shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-600 tracking-widest uppercase">
              Analysis Engine
            </span>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full py-12 lg:py-20 px-6 lg:px-8 relative z-10">
        <AnimatePresence mode="wait">
          {!insights && streamingInsights.length === 0 ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                    Upload & Analyze
                  </h1>
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto"
                >
                  Transform your prospect data into actionable sales intelligence powered by AI
                </motion.p>
              </div>

              {/* Upload Form */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 lg:p-12"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* File Upload */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                        Select Your Data File
                      </h2>
                      <p className="text-slate-600">Upload your prospect list in Excel or CSV format</p>
                    </div>

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
                    
                    <motion.label
                      htmlFor="file"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`relative flex flex-col items-center justify-center w-full px-8 py-16 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        isDragging
                          ? "border-blue-500 bg-blue-50/50 scale-105"
                          : selectedFile
                          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50"
                          : "border-slate-300 hover:border-blue-400 bg-gradient-to-br from-slate-50 to-blue-50 hover:shadow-lg"
                      }`}
                    >
                      <motion.div
                        animate={isDragging ? { scale: 1.2 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg 
                          className={`w-16 h-16 mb-4 ${selectedFile ? 'text-green-500' : 'text-slate-400'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                          />
                        </svg>
                      </motion.div>
                      
                      <AnimatePresence mode="wait">
                        {selectedFile ? (
                          <motion.div
                            key="selected"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center"
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="font-semibold text-slate-900 text-lg">{selectedFile.name}</p>
                            </div>
                            <p className="text-sm text-slate-600">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center"
                          >
                            <p className="text-lg font-semibold text-slate-900 mb-1">
                              {isDragging ? "Drop your file here" : "Click to upload or drag & drop"}
                            </p>
                            <p className="text-sm text-slate-600">Excel (.xlsx, .xls) or CSV • Up to 10 MB</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.label>
                  </div>

                  {/* Required Columns */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Required Columns</h3>
                      <p className="text-sm text-slate-600">Make sure your file includes these columns</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { col: "NAME", options: ["name", "full_name"], icon: "👤" },
                        { col: "ROLE", options: ["role", "title"], icon: "💼" },
                        { col: "COMPANY", options: ["company", "org"], icon: "🏢" }
                      ].map((req, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 + idx * 0.1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="text-center mb-4">
                            <span className="text-3xl mb-2 block">{req.icon}</span>
                            <p className="font-bold text-slate-900 text-sm uppercase tracking-wide">{req.col}</p>
                          </div>
                          <div className="space-y-2">
                            {req.options.map((opt, i) => (
                              <div key={i}>
                                <code className="block px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-900 font-mono text-center">
                                  {opt}
                                </code>
                                {i === 0 && <p className="text-center text-xs text-slate-500 py-1">or</p>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1 }}
                      className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                    >
                      <p className="text-sm text-slate-700 text-center">
                        <strong className="text-blue-900">Optional:</strong> location, description, profile
                      </p>
                    </motion.div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <p className="text-sm text-red-700">⚠️ {error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isPending || !selectedFile}
                    whileHover={!isPending && selectedFile ? { scale: 1.02 } : {}}
                    whileTap={!isPending && selectedFile ? { scale: 0.98 } : {}}
                    className="relative w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isPending ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing Prospects...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Analyze Prospects
                        </>
                      )}
                    </span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{
                        x: ['-100%', '200%']
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* API Error Handling */}
              <AnimatePresence>
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl shadow-sm"
                  >
                    <p className="text-sm text-yellow-800">{apiError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Indicator */}
              <AnimatePresence>
                {!insights && streamingInsights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                          Analysis In Progress
                        </h2>
                        <p className="text-sm text-slate-600">
                          {totalProcessed}/{totalInFile} prospects analyzed • {streamingProgress}% complete
                        </p>
                      </div>
                      <motion.div 
                        className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {streamingProgress}%
                      </motion.div>
                    </div>
                    
                    <div className="relative w-full bg-slate-200 rounded-full h-4 overflow-hidden mb-6 shadow-inner">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${streamingProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent h-full"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    
                    <p className="text-sm text-slate-700 mb-4 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      {streamingMessage}
                    </p>
                    
                    {isStillProcessing && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 bg-white/50 rounded-lg p-3">
                        <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                        <span>Processing additional prospects in batch mode...</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Export Available Data During Processing */}
              <AnimatePresence>
                {availableForExport && isStillProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-8 shadow-xl"
                  >
                    <h3 className="text-2xl font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {totalProcessed} Prospects Ready
                    </h3>
                    <p className="text-slate-700 mb-6">
                      Download insights for {totalProcessed} analyzed prospects while we continue processing the remaining {totalInFile - totalProcessed} in the background.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadInsights(availableForExport)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 shadow-lg"
                      >
                        Download Available (Text)
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadJSON(availableForExport)}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 shadow-lg"
                      >
                        Download Available (JSON)
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completion */}
              <AnimatePresence>
                {insights && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-2xl p-8 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <motion.svg 
                        className="w-8 h-8 text-green-600"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </motion.svg>
                      <h2 className="text-3xl font-bold text-green-900">Analysis Complete</h2>
                    </div>
                    <p className="text-slate-700 mb-6">
                      Successfully generated insights for all {insights.prospectInsights.length} prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadInsights()}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg"
                      >
                        Download Text
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => downloadJSON()}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg"
                      >
                        Download JSON
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setInsights(null);
                          setStreamingInsights([]);
                          setSelectedFile(null);
                          setAvailableForExport(null);
                          setApiError(null);
                        }}
                        className="px-6 py-3 border-2 border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-100 shadow-sm"
                      >
                        Analyze Another
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <div className="space-y-6">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                  Prospect Insights
                </h2>
                <div className="grid gap-6">
                  {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.01, y: -5 }}
                      className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
                    >
                      <div className="mb-6">
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                          {prospect.name}
                        </h3>
                        <p className="text-lg text-slate-600 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                          {prospect.role}
                        </p>
                      </div>

                      <div className="mb-6 pb-6 border-b border-slate-200">
                        <p className="text-slate-700 leading-relaxed">{prospect.profileNotes}</p>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          Pitch Suggestions
                        </h4>
                        <div className="space-y-3">
                          {prospect.pitchSuggestions.map((pitch, pIdx) => (
                            <motion.div
                              key={pIdx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 + pIdx * 0.05 }}
                              className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl text-slate-700 hover:shadow-md transition-all"
                            >
                              <strong className="text-blue-600 font-bold">{pIdx + 1}.</strong> {pitch.pitch}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1 + 0.3 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6"
                      >
                        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          Opening Message
                        </p>
                        <p className="italic text-slate-800 text-lg leading-relaxed">"{prospect.conversationStarter}"</p>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="border-t border-white/20 bg-white/40 backdrop-blur-lg relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 text-center text-sm text-slate-600">
          <p>&copy; 2025 Cehpoint. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
