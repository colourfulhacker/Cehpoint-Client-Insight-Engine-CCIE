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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!insights ? (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Upload Prospect Data
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your Excel or CSV file containing LinkedIn prospect data to generate AI-powered insights
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="file" 
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                  >
                    Select File
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
                      className="flex items-center justify-center w-full px-6 py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {selectedFile ? (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                              Click to upload or drag and drop
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Excel (.xlsx, .xls) or CSV files (max 10MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Required Columns:
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• <strong>name</strong> or <strong>full_name</strong></li>
                      <li>• <strong>role</strong> or <strong>occupation</strong></li>
                      <li>• <strong>company</strong> or <strong>organization</strong></li>
                      <li>• <strong>location</strong> (optional)</li>
                      <li>• <strong>description</strong> or <strong>profile</strong> (optional)</li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing with AI...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate Insights</span>
                    </>
                  )}
                </button>
              </form>

              {isPending && (
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI Analysis in Progress
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        This usually takes 30-60 seconds. We're analyzing your prospects and generating personalized insights...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Analysis Complete!
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Generated insights for {insights.prospectInsights.length} prospects
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadInsights}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download TXT
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Download JSON
                  </button>
                  <button
                    onClick={() => {
                      setInsights(null);
                      setSelectedFile(null);
                      setError(null);
                    }}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Analysis
                  </button>
                </div>
              </div>
            </div>

            {insights.idealClientFramework && insights.idealClientFramework.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    🎯
                  </span>
                  Ideal Client Framework
                </h2>
                <div className="space-y-6">
                  {insights.idealClientFramework.map((category, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-6 py-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {category.category}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {category.description}
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Key Needs:</p>
                        <ul className="space-y-1.5">
                          {category.needs.map((need, nidx) => (
                            <li key={nidx} className="text-gray-600 dark:text-gray-400 flex items-start gap-2 text-sm">
                              <span className="text-blue-500 mt-0.5">▸</span>
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

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                  👥
                </span>
                Prospect Insights ({insights.prospectInsights.length})
              </h2>
              <div className="space-y-6">
                {insights.prospectInsights.map((prospect, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {idx + 1}. {prospect.name}
                        </h3>
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full">
                          Prospect
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {prospect.role}
                      </p>
                    </div>

                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        Profile Analysis
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {prospect.profileNotes}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Pitch Suggestions
                      </h4>
                      <ol className="list-decimal list-inside space-y-2.5">
                        {prospect.pitchSuggestions.map((suggestion, sidx) => (
                          <li key={sidx} className="text-gray-700 dark:text-gray-300 text-sm pl-2">
                            {suggestion.pitch}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        Conversation Starter
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
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
