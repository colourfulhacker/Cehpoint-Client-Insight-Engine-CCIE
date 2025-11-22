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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="hover:opacity-70 transition-opacity">
            <Logo />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full py-20 px-6 lg:px-8">
        {!insights ? (
          <div className="space-y-12">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-slate-900 dark:text-white">
                Analyze Prospects
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
                Upload your prospect data to generate actionable outreach strategies and personalized recommendations for each contact.
              </p>
            </div>

            {/* Upload Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* File Upload */}
                <div className="space-y-4">
                  <label htmlFor="file" className="block text-sm font-semibold text-slate-900 dark:text-white">
                    Select File
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
                      className={`flex flex-col items-center justify-center w-full px-8 py-16 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        selectedFile
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                          : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/50"
                      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <svg
                        className={`w-12 h-12 mb-4 ${
                          selectedFile ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
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
                          <p className="font-semibold text-slate-900 dark:text-white text-base">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="font-semibold text-slate-900 dark:text-white text-base">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            Excel (.xlsx, .xls) or CSV format, max 10 MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                      Required Columns
                    </h4>
                    <ul className="text-sm space-y-2.5">
                      <li className="text-slate-700 dark:text-slate-300">
                        • <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">name</span> or <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">full_name</span>
                      </li>
                      <li className="text-slate-700 dark:text-slate-300">
                        • <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">role</span> or <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">occupation</span>
                      </li>
                      <li className="text-slate-700 dark:text-slate-300">
                        • <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">company</span> or <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">organization</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Optional: <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">location</span>, <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">description</span>, <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">profile</span>
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending || !selectedFile}
                  className="w-full bg-blue-600 hover:enabled:bg-blue-700 active:enabled:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-5 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg min-h-16 shadow-lg hover:enabled:shadow-xl"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
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
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    "ANALYZE PROSPECTS"
                  )}
                </button>

                {isPending && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Analyzing your prospects. This typically takes 30-60 seconds.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Success Banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
              <div className="flex gap-4 items-start mb-8">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Analysis Complete
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                    Generated insights for <span className="font-semibold">{insights.prospectInsights.length}</span> prospect{insights.prospectInsights.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadInsights}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm min-h-12 flex items-center justify-center shadow-md"
                >
                  Download as Text
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm min-h-12 flex items-center justify-center shadow-md"
                >
                  Download as JSON
                </button>
                <button
                  onClick={() => {
                    setInsights(null);
                    setSelectedFile(null);
                  }}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm min-h-12 flex items-center justify-center"
                >
                  Upload New File
                </button>
              </div>
            </div>

            {/* Results Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Prospect Insights
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Detailed analysis and recommendations for each prospect
              </p>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              {insights.prospectInsights.map((prospect, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {/* Prospect Header */}
                  <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {prospect.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {prospect.role}
                    </p>
                  </div>

                  {/* Profile Notes */}
                  <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3">
                      Profile Summary
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {prospect.profileNotes}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4">
                      Service Recommendations
                    </h4>
                    <ol className="space-y-3 list-none">
                      {prospect.pitchSuggestions.map((pitch, pIdx) => (
                        <li key={pIdx} className="flex gap-4">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-500 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            {pIdx + 1}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                            {pitch.pitch}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Conversation Starter */}
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-3">
                      Opening Message
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
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
