"use client";

import { useState } from "react";
import { ClientInsightReport, ProspectInsight } from "@/lib/types";
import Link from "next/link";
import Logo from "../components/Logo";

interface BatchUpdate {
  type: string;
  batchNumber?: number;
  totalBatches?: number;
  batches?: number;
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-70 transition-opacity duration-300">
            <Logo />
          </Link>
          <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Analysis Engine
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full py-20 px-6 lg:px-8">
        {!insights && streamingInsights.length === 0 ? (
          <div className="space-y-20 animate-fadeInDown">
            {/* Header */}
            <div className="space-y-8 text-center">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Upload & Analyze
              </h1>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
                Share your prospect data and receive personalized, actionable sales intelligence. Results display in real-time as our system analyzes each batch.
              </p>
            </div>

            {/* Upload Form Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-2xl opacity-50" />
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10 lg:p-16 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* File Upload */}
                  <div className="space-y-6 pb-6 border-b border-slate-700/30">
                    <div>
                      <label htmlFor="file" className="block text-2xl font-black text-white mb-2">
                        📂 Select Your Data File
                      </label>
                      <p className="text-sm text-slate-400">Upload your prospect list (Excel or CSV format)</p>
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
                      aria-label="Upload prospect data file"
                    />
                    <label
                      htmlFor="file"
                      className={`flex flex-col items-center justify-center w-full px-8 py-16 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group ${
                        selectedFile
                          ? "border-emerald-400/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                          : "border-blue-400/60 hover:border-blue-300/80 hover:bg-blue-500/10 bg-slate-800/40 hover:shadow-lg hover:shadow-blue-500/10"
                      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className={`w-16 h-16 mb-6 transition-all duration-300 ${
                          selectedFile ? "text-emerald-400 scale-110" : "text-slate-500 group-hover:text-blue-400 group-hover:scale-110"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
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
                        <div className="text-center animate-scaleIn">
                          <p className="font-semibold text-white text-lg">
                            ✓ {selectedFile.name}
                          </p>
                          <p className="text-sm text-slate-400 mt-2">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <p className="font-black text-white text-xl">
                            Click to upload or drag & drop
                          </p>
                          <p className="text-sm text-slate-400">
                            Excel (.xlsx, .xls) or CSV • Up to 10 MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Requirements Grid */}
                  <div className="pt-6 space-y-8">
                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/20 border border-slate-700/40 rounded-lg p-6">
                      <h4 className="font-black text-white text-lg flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        Required Columns
                      </h4>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-5 p-6 bg-gradient-to-br from-blue-900/25 to-slate-900/30 rounded-lg border-2 border-blue-500/50 hover:border-blue-500/80 transition-all">
                        <p className="text-lg text-blue-200 uppercase tracking-wider font-bold">👤 Name</p>
                        <div className="flex flex-col gap-4">
                          <code className="px-4 py-3 bg-blue-950/50 rounded-md text-base text-blue-100 font-mono border-l-4 border-blue-400 hover:bg-blue-950/70 transition-all">name</code>
                          <span className="text-blue-300 text-base font-bold text-center">— or —</span>
                          <code className="px-4 py-3 bg-blue-950/50 rounded-md text-base text-blue-100 font-mono border-l-4 border-blue-400 hover:bg-blue-950/70 transition-all">full_name</code>
                        </div>
                      </div>
                      <div className="space-y-5 p-6 bg-gradient-to-br from-purple-900/25 to-slate-900/30 rounded-lg border-2 border-purple-500/50 hover:border-purple-500/80 transition-all">
                        <p className="text-lg text-purple-200 uppercase tracking-wider font-bold">💼 Role</p>
                        <div className="flex flex-col gap-4">
                          <code className="px-4 py-3 bg-purple-950/50 rounded-md text-base text-purple-100 font-mono border-l-4 border-purple-400 hover:bg-purple-950/70 transition-all">role</code>
                          <span className="text-purple-300 text-base font-bold text-center">— or —</span>
                          <code className="px-4 py-3 bg-purple-950/50 rounded-md text-base text-purple-100 font-mono border-l-4 border-purple-400 hover:bg-purple-950/70 transition-all">title</code>
                        </div>
                      </div>
                      <div className="space-y-5 p-6 bg-gradient-to-br from-cyan-900/25 to-slate-900/30 rounded-lg border-2 border-cyan-500/50 hover:border-cyan-500/80 transition-all">
                        <p className="text-lg text-cyan-200 uppercase tracking-wider font-bold">🏢 Company</p>
                        <div className="flex flex-col gap-4">
                          <code className="px-4 py-3 bg-cyan-950/50 rounded-md text-base text-cyan-100 font-mono border-l-4 border-cyan-400 hover:bg-cyan-950/70 transition-all">company</code>
                          <span className="text-cyan-300 text-base font-bold text-center">— or —</span>
                          <code className="px-4 py-3 bg-cyan-950/50 rounded-md text-base text-cyan-100 font-mono border-l-4 border-cyan-400 hover:bg-cyan-950/70 transition-all">org</code>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                      <p className="text-sm text-slate-300 font-medium">
                        💡 <strong>Optional columns:</strong> location, description, profile
                      </p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5 backdrop-blur-sm animate-shake" role="alert">
                      <p className="text-sm text-red-300 font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending || !selectedFile}
                    className="w-full group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl blur-xl opacity-80 group-hover:enabled:opacity-100 transition-all duration-300 group-active:enabled:scale-95" />
                    <div className={`relative text-white font-black py-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg min-h-16 shadow-2xl ${
                      isPending 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/50' 
                        : selectedFile 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-95 shadow-blue-600/50'
                          : 'bg-gradient-to-r from-blue-500/50 to-blue-400/50 cursor-not-allowed shadow-blue-500/30 hover:from-blue-500/60 hover:to-blue-400/60'
                    }`}>
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
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{selectedFile ? 'ANALYZE PROSPECTS' : 'SELECT A FILE TO START'}</span>
                        </>
                      )}
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-16 animate-fadeInDown">
            {/* Progress Section */}
            {!insights && streamingInsights.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-blue-600/10 to-cyan-600/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-10 shadow-2xl animate-scaleIn">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 animate-pulse">
                            <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Analysis In Progress
                        </h2>
                        <p className="text-base text-blue-200/80">
                          {streamingMessage}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-5xl font-black bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                          {streamingProgress}%
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          {streamingInsights.length} prospect{streamingInsights.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Premium Progress Bar */}
                    <div className="space-y-3">
                      <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden border border-slate-700/30">
                        <div
                          className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 h-full transition-all duration-700 rounded-full shadow-lg shadow-blue-500/50"
                          style={{ width: `${streamingProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Processing</span>
                        <span>Batch {Math.ceil((streamingInsights.length / 5) || 1)}/{totalBatches}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {insights && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-2xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-emerald-600/10 to-teal-600/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-10 shadow-2xl animate-scaleIn">
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center animate-bounce" style={{ animationDelay: '0s' }}>
                      <svg className="w-6 h-6 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white">
                        Analysis Complete
                      </h2>
                      <p className="text-emerald-200/80 text-base mt-2">
                        Generated insights for <span className="font-bold text-emerald-300">{insights.prospectInsights.length}</span> prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-8">
                    <button
                      onClick={downloadInsights}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download as Text
                    </button>
                    <button
                      onClick={downloadJSON}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold rounded-lg transition-all text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
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
                      className="px-6 py-3 border-2 border-slate-700/50 hover:border-slate-600 text-white font-bold rounded-lg hover:bg-slate-800/20 active:scale-95 transition-all text-sm"
                    >
                      Analyze Another File
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="space-y-4 pb-8 border-b border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🎯</div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Prospect Intelligence
                </h2>
              </div>
              <p className="text-lg text-slate-400 font-light pl-12">
                {insights ? 'AI-powered analysis and personalized recommendations for each prospect' : `${streamingInsights.length} prospect${streamingInsights.length !== 1 ? 's' : ''} analyzed—more coming in real-time`}
              </p>
            </div>

            {/* Results Grid */}
            <div className="space-y-8">
              {(insights?.prospectInsights || streamingInsights).map((prospect, idx) => (
                <div
                  key={idx}
                  className="group relative animate-fadeInUp"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-transparent rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/40 hover:border-slate-600/70 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Gradient Top Border */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-600/0 via-blue-500/50 to-blue-600/0" />

                    {/* Content Container */}
                    <div className="p-8 lg:p-12">
                      {/* Header Section - Enhanced */}
                      <div className="mb-12">
                        <div className="flex items-start gap-6 mb-6">
                          {/* Avatar */}
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/10 border border-blue-500/40 flex items-center justify-center text-4xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex-shrink-0">
                            👤
                          </div>
                          
                          {/* Name & Role */}
                          <div className="flex-1">
                            <h3 className="text-3xl font-black text-white mb-2">
                              {prospect.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <p className="text-base text-slate-400 font-medium">
                                {prospect.role}
                              </p>
                            </div>
                          </div>

                          {/* Card Number Badge */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
                            <span className="text-lg font-black text-blue-300">
                              #{idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-slate-700/50 via-slate-600/30 to-slate-700/50" />
                      </div>

                      {/* Profile Notes - Enhanced */}
                      <div className="mb-12">
                        <div className="flex items-center gap-2 mb-5">
                          <span className="text-xl">📊</span>
                          <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                            Profile Summary
                          </h4>
                        </div>
                        <p className="text-base text-slate-300 leading-relaxed pl-7">
                          {prospect.profileNotes}
                        </p>
                      </div>

                      {/* Service Recommendations - Premium Layout */}
                      <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                          <span className="text-xl">🎯</span>
                          <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">
                            Service Recommendations
                          </h4>
                        </div>
                        
                        <div className="space-y-4 pl-1">
                          {prospect.pitchSuggestions.map((pitch, pIdx) => (
                            <div 
                              key={pIdx} 
                              className="group/pitch relative flex gap-5 p-6 rounded-xl bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-slate-700/40 hover:border-blue-500/50 hover:bg-blue-500/8 transition-all duration-300"
                            >
                              {/* Left border accent */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/60 to-purple-500/30 rounded-l-xl opacity-0 group-hover/pitch:opacity-100 transition-all duration-300" />
                              
                              {/* Number Badge */}
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/40 to-purple-600/30 border border-blue-400/60 flex items-center justify-center text-xs font-bold text-blue-200 group-hover/pitch:from-blue-600/60 group-hover/pitch:to-purple-600/50 transition-all duration-300">
                                {pIdx + 1}
                              </div>
                              
                              {/* Pitch Text */}
                              <div className="flex-1">
                                <p className="text-base text-slate-300 leading-relaxed font-medium">
                                  {pitch.pitch}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Opening Message - Premium Quote Style */}
                      <div className="relative">
                        {/* Background accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/5 rounded-xl blur opacity-60" />
                        
                        <div className="relative bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/30 border border-emerald-500/20 rounded-xl p-8 hover:border-emerald-500/40 transition-all duration-300">
                          <div className="flex items-start gap-4">
                            <span className="text-3xl flex-shrink-0">💬</span>
                            <div className="flex-1">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Personalized Opening Message
                              </h4>
                              <p className="text-lg text-slate-200 italic leading-relaxed font-light">
                                &quot;{prospect.conversationStarter}&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Premium Animation Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
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
