"use client";

import { useState } from "react";
import { processLeadFile, UploadResult } from "./actions";
import { ClientInsightReport } from "@/lib/types";
import Link from "next/link";
import Logo from "../components/Logo";

export default function UploadPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClientInsightReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const formData = new FormData(event.currentTarget);
    const result = await processLeadFile(formData);

    setIsPending(false);

    if (result.success && result.insights) {
      setInsights(result.insights);
    } else if (result.error) {
      setError(result.error);
    }
  };

  const downloadInsights = () => {
    if (!insights) return;

    const content = formatInsightsAsText(insights);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-insights-${new Date().toISOString().split("T")[0]}.txt`;
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
    a.download = `client-insights-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-blue-200 dark:border-blue-900 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
        {!insights ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 mb-4 glow-pulse">
                Upload Prospect Data
              </h1>
              <p className="text-xl text-gray-900 dark:text-gray-100 font-medium">
                Upload your Excel or CSV file containing LinkedIn prospect data to generate AI-powered insights
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-3xl shadow-2xl border-2 border-purple-300/50 dark:border-purple-700/50 p-10 neon-glow-pink">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label
                    htmlFor="file"
                    className="block text-lg font-bold text-gray-900 dark:text-white mb-6"
                  >
                    📁 Select File
                  </label>

                  <div className="relative">
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
                      className={`flex flex-col items-center justify-center w-full px-8 py-20 border-4 border-dashed rounded-3xl cursor-pointer transition-all font-bold ${
                        selectedFile
                          ? "border-emerald-400 dark:border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20"
                          : "border-cyan-400 dark:border-cyan-600 hover:border-purple-500 dark:hover:border-purple-400 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 hover:to-purple-50 dark:hover:to-purple-900/10"
                      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="text-center">
                        <svg
                          className={`mx-auto h-16 w-16 mb-6 ${
                            selectedFile ? "text-emerald-500" : "text-cyan-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>

                        {selectedFile ? (
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              ✓ {selectedFile.name}
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mt-3 font-medium">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mt-3 font-medium">
                              Excel (.xlsx, .xls) or CSV files (max 10MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-6">
                    <h4 className="text-base font-bold text-purple-900 dark:text-purple-200 mb-4">
                      📋 Required & Optional Columns:
                    </h4>
                    <ul className="text-base text-purple-900 dark:text-purple-300 space-y-3 font-medium">
                      <li className="font-bold text-lg">Required:</li>
                      <li className="ml-6">• <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">name</span> or <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">full_name</span></li>
                      <li className="ml-6">• <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">role</span> or <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">occupation</span></li>
                      <li className="ml-6">• <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">company</span> or <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">organization</span></li>
                      <li className="font-bold text-lg mt-4">Optional:</li>
                      <li className="ml-6">• <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">location</span></li>
                      <li className="ml-6">• <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">description</span> or <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">profile</span></li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <svg
                        className="w-8 h-8 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-lg font-bold text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 hover:from-purple-700 hover:via-pink-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-8 py-6 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3 text-xl neon-glow"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24">
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
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Generate Insights</span>
                    </>
                  )}
                </button>
              </form>

              {isPending && (
                <div className="mt-10 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-blue-300 dark:border-blue-700">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-300 border-t-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        AI Analysis in Progress ⏳
                      </p>
                      <p className="text-base text-gray-700 dark:text-gray-300 mt-2 font-medium">
                        This usually takes 30-60 seconds. We're analyzing your prospects and generating personalized insights...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl border-2 border-green-500 p-10 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white dark:bg-gray-900">
                      <svg
                        className="h-10 w-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white">
                      Analysis Complete! 🎉
                    </h2>
                    <p className="text-white text-lg mt-3 font-bold">
                      Generated insights for <span className="text-2xl">{insights.prospectInsights.length}</span> prospects
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={downloadInsights}
                    className="flex items-center gap-2 bg-white text-green-600 font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    TXT
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 bg-white text-purple-600 font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                      />
                    </svg>
                    JSON
                  </button>
                  <button
                    onClick={() => {
                      setInsights(null);
                      setSelectedFile(null);
                      setError(null);
                    }}
                    className="flex items-center gap-2 bg-white text-gray-700 font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 text-base"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    New
                  </button>
                </div>
              </div>
            </div>

            {/* Ideal Client Framework */}
            {insights.idealClientFramework && insights.idealClientFramework.length > 0 && (
              <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-3xl shadow-2xl border-2 border-blue-200 dark:border-blue-800 p-12">
                <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-10 flex items-center gap-4">
                  <span className="text-5xl">🎯</span>
                  Ideal Client Framework
                </h2>
                <div className="space-y-10">
                  {insights.idealClientFramework.map((category, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-8 py-4">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {idx + 1}. {category.category}
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 mb-6 leading-relaxed text-lg">
                        {category.description}
                      </p>
                      <div>
                        <p className="text-base font-bold text-blue-600 dark:text-blue-400 mb-4">
                          Key Needs:
                        </p>
                        <ul className="space-y-3">
                          {category.needs.map((need, nidx) => (
                            <li
                              key={nidx}
                              className="text-gray-800 dark:text-gray-200 flex items-start gap-4 text-lg font-medium"
                            >
                              <span className="text-blue-500 font-bold flex-shrink-0 text-2xl">▸</span>
                              <span>{need}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prospect Insights */}
            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 rounded-3xl shadow-2xl border-2 border-purple-200 dark:border-purple-800 p-12">
              <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-10 flex items-center gap-4">
                <span className="text-5xl">👥</span>
                Prospect Insights ({insights.prospectInsights.length})
              </h2>
              <div className="space-y-10">
                {insights.prospectInsights.map((prospect, idx) => (
                  <div
                    key={idx}
                    className="border-2 border-purple-300 dark:border-purple-700 rounded-3xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900"
                  >
                    <div className="mb-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                          {idx + 1}. {prospect.name}
                        </h3>
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                          Prospect
                        </span>
                      </div>
                      <p className="text-xl text-gray-700 dark:text-gray-300 font-bold">
                        {prospect.role}
                      </p>
                    </div>

                    <div className="mb-8 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border-2 border-blue-300 dark:border-blue-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3 text-lg">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Profile Analysis
                      </h4>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg font-medium">
                        {prospect.profileNotes}
                      </p>
                    </div>

                    <div className="mb-8">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Pitch Suggestions
                      </h4>
                      <ol className="space-y-4">
                        {prospect.pitchSuggestions.map((suggestion, sidx) => (
                          <li key={sidx} className="text-gray-800 dark:text-gray-200 flex gap-5 text-lg font-medium">
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 text-xl">
                              {sidx + 1}.
                            </span>
                            <span>{suggestion.pitch}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border-2 border-green-300 dark:border-green-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3 text-lg">
                        <svg
                          className="w-6 h-6 text-green-600 dark:text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Conversation Starter
                      </h4>
                      <p className="text-gray-800 dark:text-gray-200 italic leading-relaxed text-lg font-medium">
                        "{prospect.conversationStarter}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatInsightsAsText(insights: ClientInsightReport): string {
  let text = "CEHPOINT CLIENT INSIGHT ENGINE - ANALYSIS REPORT\n";
  text += "=".repeat(80) + "\n\n";
  text += `Generated: ${new Date(insights.generatedAt).toLocaleString()}\n\n`;

  if (insights.idealClientFramework && insights.idealClientFramework.length > 0) {
    text += "IDEAL CLIENT IDENTIFICATION FRAMEWORK\n";
    text += "-".repeat(80) + "\n\n";

    insights.idealClientFramework.forEach((category, idx) => {
      text += `${idx + 1}. ${category.category}\n`;
      text += `   ${category.description}\n\n`;
      text += `   Key Needs:\n`;
      category.needs.forEach((need) => {
        text += `   - ${need}\n`;
      });
      text += "\n";
    });
  }

  text += "\nPROSPECT-LEVEL INSIGHTS & PITCH SUGGESTIONS\n";
  text += "-".repeat(80) + "\n\n";

  insights.prospectInsights.forEach((prospect, idx) => {
    text += `${idx + 1}. ${prospect.name}\n`;
    text += `   Role: ${prospect.role}\n\n`;
    text += `   Profile Notes:\n   ${prospect.profileNotes}\n\n`;
    text += `   Three Pitch Suggestions:\n`;
    prospect.pitchSuggestions.forEach((suggestion, sidx) => {
      text += `   ${sidx + 1}. ${suggestion.pitch}\n`;
    });
    text += `\n   Conversation Starter:\n   "${prospect.conversationStarter}"\n\n`;
    text += "-".repeat(80) + "\n\n";
  });

  return text;
}
