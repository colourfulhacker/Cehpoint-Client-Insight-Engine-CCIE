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
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8">
        {!insights ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                Analyze Prospects
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Upload your prospect list to generate personalized outreach strategies and recommendations.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-4">
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
                      className={`flex flex-col items-center justify-center w-full px-8 py-12 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        selectedFile
                          ? "border-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-500"
                          : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50"
                      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className={`w-10 h-10 mb-3 ${
                          selectedFile ? "text-slate-600" : "text-slate-400"
                        }`}
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

                      {selectedFile ? (
                        <div className="text-center">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Excel (.xlsx, .xls) or CSV (max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                    Required Columns:
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    <li>• name or full_name</li>
                    <li>• role or occupation</li>
                    <li>• company or organization</li>
                  </ul>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                    Optional: location, description, profile
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Analyze Prospects"
                  )}
                </button>

                {isPending && (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Analyzing your prospects... This typically takes 30-60 seconds.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Success */}
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
              <div className="flex gap-4 mb-6">
                <svg className="w-6 h-6 text-slate-900 dark:text-white flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Analysis Complete
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    Generated insights for <span className="font-semibold">{insights.prospectInsights.length}</span> prospects
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadInsights}
                  className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-sm"
                >
                  Download as Text
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-sm"
                >
                  Download as JSON
                </button>
                <button
                  onClick={() => {
                    setInsights(null);
                    setSelectedFile(null);
                  }}
                  className="px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Upload New File
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Prospect Insights
              </h3>

              {insights.prospectInsights.map((prospect, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {prospect.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {prospect.role}
                    </p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {prospect.profileNotes}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                      Service Recommendations
                    </h5>
                    <ul className="space-y-2">
                      {prospect.pitchSuggestions.map((pitch, pIdx) => (
                        <li key={pIdx} className="flex gap-3">
                          <span className="text-slate-500 dark:text-slate-500 font-semibold flex-shrink-0">
                            {pIdx + 1}.
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 text-sm">
                            {pitch.pitch}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">
                      Opening Message
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm italic">
                      {prospect.conversationStarter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
    text += "Needs:\n";
    framework.needs.forEach((need) => {
      text += `  • ${need}\n`;
    });
  });

  text += "\n\n" + "=".repeat(80) + "\n";
  text += "PROSPECT INSIGHTS\n";
  text += "=".repeat(80) + "\n";

  insights.prospectInsights.forEach((prospect, idx) => {
    text += `\n${idx + 1}. ${prospect.name}\n`;
    text += `   Role: ${prospect.role}\n`;
    text += `   Profile: ${prospect.profileNotes}\n`;
    text += "   Recommendations:\n";
    prospect.pitchSuggestions.forEach((pitch, pIdx) => {
      text += `     ${pIdx + 1}. ${pitch.pitch}\n`;
    });
    text += `   Opening Message: "${prospect.conversationStarter}"\n`;
  });

  return text;
}
