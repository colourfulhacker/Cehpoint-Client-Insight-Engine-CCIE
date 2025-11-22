"use client";

import { useState } from "react";
import { ClientInsightReport, ProspectInsight } from "@/lib/types";
import Link from "next/link";
import Logo from "../components/Logo";

interface BatchUpdate {
  type: string;
  batchNumber?: number;
  totalBatches?: number;
  prospects?: ProspectInsight[];
  progress?: number;
  message?: string;
  report?: ClientInsightReport;
  totalProcessed?: number;
}

export default function UploadPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClientInsightReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamingInsights, setStreamingInsights] = useState<ProspectInsight[]>([]);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [totalBatches, setTotalBatches] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setStreamingInsights([]);
    setStreamingProgress(0);
    setStreamingMessage("");
    setTotalBatches(0);

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const update: BatchUpdate = JSON.parse(line);

            if (update.type === "status") {
              setStreamingMessage(update.message || "");
              setTotalBatches(update.batches || 0);
            } else if (update.type === "batch" && update.prospects) {
              setStreamingInsights((prev) => [...prev, ...update.prospects!]);
              setStreamingProgress(update.progress || 0);
              setStreamingMessage(`Processing batch ${update.batchNumber}/${update.totalBatches}...`);
            } else if (update.type === "complete" && update.report) {
              setInsights(update.report);
              setStreamingMessage("Analysis complete!");
              setStreamingProgress(100);
            } else if (update.type === "error") {
              throw new Error(update.message || "Unknown error during streaming");
            }
          } catch (parseError) {
            console.error("Failed to parse streaming update:", line, parseError);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setStreamingInsights([]);
      setStreamingProgress(0);
      setStreamingMessage("");
    } finally {
      setIsPending(false);
    }
  };

  const downloadInsights = () => {
    if (!insights) return;

    const content = formatInsightsAsText(insights);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cehpoint-insights-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!insights) return;

    const blob = new Blob([JSON.stringify(insights, null, 2)], { type: "application/json" });
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo />
          </Link>
          <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Analysis
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full py-16 px-6 lg:px-8">
        {!insights && streamingInsights.length === 0 ? (
          <div className="space-y-16">
            {/* Header */}
            <div className="space-y-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Upload & Analyze
              </h1>
              <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Share your prospect data and receive personalized, actionable sales intelligence. Results display in real-time as our system analyzes each batch.
              </p>
            </div>

            {/* Upload Form */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 lg:p-12 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload */}
                <div className="space-y-4">
                  <label htmlFor="file" className="block text-sm font-semibold text-white">
                    Select Your Data File
                  </label>

                  <div>
                    <input
                      type="file"
                      id="file"
                      name="file"
                      accept=".xlsx,.xls,.csv"
                      required
                      disabled={isPending}
                      onChange={handleFileChange}
                      className="hidden"
                      aria-label="Upload prospect data file"
                    />
                    <label
                      htmlFor="file"
                      className={`flex flex-col items-center justify-center w-full px-8 py-20 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedFile
                          ? "border-blue-500 bg-blue-500/10 dark:bg-blue-900/20"
                          : "border-slate-700 hover:border-blue-500 bg-slate-800/30"
                      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className={`w-14 h-14 mb-4 transition-colors ${
                          selectedFile ? "text-blue-400" : "text-slate-500"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z"
                        />
                      </svg>

                      {selectedFile ? (
                        <div className="text-center">
                          <p className="font-semibold text-white text-base">
                            ✓ {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-semibold text-white text-base">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-slate-400 mt-2">
                            Excel (.xlsx, .xls) or CSV, up to 10 MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Requirements Box */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-4">
                      📋 Required Columns
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Name</p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">name</span>
                          <span className="text-slate-500">or</span>
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">full_name</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Role</p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">role</span>
                          <span className="text-slate-500">or</span>
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">title</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Company</p>
                        <div className="flex gap-2">
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">company</span>
                          <span className="text-slate-500">or</span>
                          <span className="inline-block px-2.5 py-1 bg-slate-900 rounded text-xs text-slate-300 font-mono">org</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">
                      💡 <span className="text-slate-400">Optional: location, description, profile</span>
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 backdrop-blur" role="alert">
                    <p className="text-sm text-red-300 font-medium">
                      ⚠️ {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg blur opacity-75 group-hover:enabled:opacity-100 transition-opacity" />
                  <div className="relative bg-blue-600 hover:enabled:bg-blue-700 active:enabled:bg-blue-800 disabled:bg-blue-900 text-white font-bold py-5 rounded-lg transition-all flex items-center justify-center gap-3 text-base min-h-14 shadow-lg">
                    {isPending ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>ANALYZING...</span>
                      </>
                    ) : (
                      "ANALYZE PROSPECTS"
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Progress Section */}
            {!insights && streamingInsights.length > 0 && (
              <div className="bg-gradient-to-br from-blue-600/10 to-blue-500/5 backdrop-blur border border-blue-500/30 rounded-xl p-8 shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="inline-block w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Analysis In Progress
                      </h2>
                      <p className="text-sm text-blue-300">
                        {streamingMessage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-400">
                        {streamingProgress}%
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {streamingInsights.length} prospect{streamingInsights.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-500 rounded-full shadow-lg shadow-blue-500/50"
                        style={{ width: `${streamingProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Processing</span>
                      <span>Batch {Math.ceil((streamingInsights.length / 5) || 1)}/{totalBatches}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {insights && (
              <div className="bg-gradient-to-br from-green-600/10 to-green-500/5 backdrop-blur border border-green-500/30 rounded-xl p-8 shadow-lg">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mt-1">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">
                      Analysis Complete
                    </h2>
                    <p className="text-green-300 text-sm mt-1">
                      Generated insights for <span className="font-semibold">{insights.prospectInsights.length}</span> prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={downloadInsights}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download as Text
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download as JSON
                  </button>
                  <button
                    onClick={() => {
                      setInsights(null);
                      setStreamingInsights([]);
                      setSelectedFile(null);
                    }}
                    className="px-6 py-3 border-2 border-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-sm"
                  >
                    Analyze Another File
                  </button>
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white">
                Prospect Intelligence
              </h2>
              <p className="text-slate-300 text-sm">
                {insights ? 'Complete analysis and personalized recommendations for each prospect' : `${streamingInsights.length} prospect${streamingInsights.length !== 1 ? 's' : ''} analyzed so far`}
              </p>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-slate-700 rounded-xl p-8 hover:shadow-xl transition-all duration-300 animate-fadeIn"
                >
                  {/* Prospect Header */}
                  <div className="mb-8 pb-6 border-b border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {prospect.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {prospect.role}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Notes */}
                  <div className="mb-8 pb-6 border-b border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                      📊 Profile Summary
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {prospect.profileNotes}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="mb-8 pb-6 border-b border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                      🎯 Service Recommendations
                    </h4>
                    <div className="space-y-3">
                      {prospect.pitchSuggestions.map((pitch, pIdx) => (
                        <div key={pIdx} className="flex gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-700 transition-colors">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs font-bold text-blue-400">
                            {pIdx + 1}
                          </span>
                          <span className="text-sm text-slate-300 leading-relaxed pt-0.5">
                            {pitch.pitch}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversation Starter */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-lg p-6">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                      💬 Opening Message
                    </h4>
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      "{prospect.conversationStarter}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

function formatInsightsAsText(insights: ClientInsightReport): string {
  let text = "CEHPOINT CLIENT INSIGHTS REPORT\n";
  text += `Generated: ${new Date(insights.generatedAt).toLocaleString()}\n`;
  text += "=".repeat(80) + "\n\n";

  text += "CLIENT CATEGORIES\n";
  text += "-".repeat(80) + "\n";
  insights.idealClientFramework.forEach((framework) => {
    text += `\n${framework.category}\n`;
    text += `${framework.description}\n`;
    text += "Strategic Needs:\n";
    framework.needs.forEach((need) => {
      text += `  • ${need}\n`;
    });
  });

  text += "\n\n" + "=".repeat(80) + "\n";
  text += "PROSPECT INSIGHTS & RECOMMENDATIONS\n";
  text += "=".repeat(80) + "\n";

  insights.prospectInsights.forEach((prospect, idx) => {
    text += `\n${idx + 1}. ${prospect.name}\n`;
    text += `   Role: ${prospect.role}\n`;
    text += `   Profile: ${prospect.profileNotes}\n`;
    text += "   Service Recommendations:\n";
    prospect.pitchSuggestions.forEach((pitch, pIdx) => {
      text += `     ${pIdx + 1}. ${pitch.pitch}\n`;
    });
    text += `   Opening Message: "${prospect.conversationStarter}"\n`;
  });

  return text;
}
