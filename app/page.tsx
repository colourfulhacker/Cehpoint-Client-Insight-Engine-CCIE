"use client";

import { useState } from "react";
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setApiError(null);
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
    <div className="min-h-screen flex flex-col bg-white text-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs font-semibold text-slate-600 tracking-widest uppercase">
            Analysis Engine
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full py-20 px-6 lg:px-8">
        {!insights && streamingInsights.length === 0 ? (
          <div className="space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-950">
                Upload & Analyze
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Share your prospect data and receive personalized sales intelligence instantly
              </p>
            </div>

            {/* Upload Form */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-12 lg:p-16">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload */}
                <div className="space-y-6 pb-8 border-b border-slate-200">
                  <div>
                    <label htmlFor="file" className="block text-2xl font-bold text-slate-950 mb-2">
                      Select Your Data File
                    </label>
                    <p className="text-slate-600">Upload your prospect list (Excel or CSV)</p>
                  </div>

                  <input
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
                    className={`flex flex-col items-center justify-center w-full px-8 py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      selectedFile
                        ? "border-green-500 bg-green-50"
                        : "border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <svg className="w-12 h-12 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z" />
                    </svg>
                    {selectedFile ? (
                      <p className="font-semibold text-slate-950">✓ {selectedFile.name}</p>
                    ) : (
                      <div className="text-center">
                        <p className="font-semibold text-slate-950">Click to upload or drag & drop</p>
                        <p className="text-sm text-slate-600 mt-1">Excel or CSV • Up to 10 MB</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Required Columns */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 mb-4">Required Columns</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { col: "NAME", options: ["name", "full_name"] },
                        { col: "ROLE", options: ["role", "title"] },
                        { col: "COMPANY", options: ["company", "org"] }
                      ].map((req, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <p className="font-semibold text-slate-950 mb-3 text-sm uppercase">{req.col}</p>
                          <div className="space-y-2">
                            {req.options.map((opt, i) => (
                              <div key={i}>
                                <code className="block px-3 py-2 bg-slate-100 rounded text-sm text-slate-950 font-mono">{opt}</code>
                                {i === 0 && <p className="text-center text-xs text-slate-500 py-1">or</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>Optional:</strong> location, description, profile
                    </p>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">⚠️ {error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full py-4 bg-slate-950 text-white font-semibold rounded-lg hover:bg-slate-900 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? "Analyzing..." : "Analyze Prospects"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* API Error Handling */}
            {apiError && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{apiError}</p>
              </div>
            )}

            {/* Progress Indicator */}
            {!insights && streamingInsights.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950 mb-1">Analysis In Progress</h2>
                    <p className="text-sm text-slate-600">
                      {totalProcessed}/{totalInFile} prospects loaded • {streamingProgress}% complete
                    </p>
                  </div>
                  <div className="text-4xl font-bold text-slate-950">{streamingProgress}%</div>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-6">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${streamingProgress}%` }}
                  />
                </div>
                
                <p className="text-sm text-slate-700 mb-4">{streamingMessage}</p>
                
                {isStillProcessing && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                    <span>Processing more prospects (batch mode active)...</span>
                  </div>
                )}
              </div>
            )}

            {/* Export Available Data During Processing */}
            {availableForExport && isStillProcessing && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
                <h3 className="text-lg font-bold text-slate-950 mb-3">✓ {totalProcessed} Prospects Ready</h3>
                <p className="text-slate-700 mb-4">
                  You can download insights for the {totalProcessed} prospects loaded so far while we continue processing the remaining {totalInFile - totalProcessed} prospects in batch mode.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadInsights(availableForExport)}
                    className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-sm"
                  >
                    Download Available (Text)
                  </button>
                  <button
                    onClick={() => downloadJSON(availableForExport)}
                    className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 text-sm"
                  >
                    Download Available (JSON)
                  </button>
                </div>
              </div>
            )}

            {/* Completion */}
            {insights && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-slate-950 mb-4">✓ Analysis Complete</h2>
                <p className="text-slate-700 mb-6">Generated insights for all {insights.prospectInsights.length} prospect{insights.prospectInsights.length !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadInsights()}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm"
                  >
                    Download Text
                  </button>
                  <button
                    onClick={() => downloadJSON()}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-sm"
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
                    className="px-4 py-2 border border-slate-300 text-slate-950 font-semibold rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Analyze Another
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-950">Insights</h2>
              {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-md transition-all"
                >
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-950">{prospect.name}</h3>
                    <p className="text-slate-600">{prospect.role}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <p className="text-slate-700">{prospect.profileNotes}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-slate-950 mb-3">Pitch Suggestions</h4>
                    <div className="space-y-3">
                      {prospect.pitchSuggestions.map((pitch, pIdx) => (
                        <div key={pIdx} className="p-3 bg-slate-50 rounded-lg text-slate-700 text-sm">
                          <strong className="text-slate-950">{pIdx + 1}.</strong> {pitch.pitch}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Opening Message</p>
                    <p className="italic text-slate-800">"{prospect.conversationStarter}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 text-center text-sm text-slate-600">
          <p>&copy; 2025 Cehpoint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
