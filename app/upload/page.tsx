"use client";

import { useState } from "react";
import { processLeadFile, UploadResult } from "./actions";
import { ClientInsightReport } from "@/lib/types";
import Link from "next/link";

export default function UploadPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ClientInsightReport | null>(null);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Upload Prospect Data
        </h1>

        {!insights ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  htmlFor="file" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Select Excel or CSV File
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept=".xlsx,.xls,.csv"
                  required
                  disabled={isPending}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none p-2.5"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Upload a file containing prospect data with columns: name, role, company, location, description
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md disabled:cursor-not-allowed"
              >
                {isPending ? "Analyzing..." : "Upload and Analyze"}
              </button>
            </form>

            {isPending && (
              <div className="mt-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600 dark:text-gray-400">
                  Analyzing prospects with AI... This may take a minute.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Analysis Complete
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={downloadInsights}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Download TXT
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => setInsights(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            </div>

            {insights.idealClientFramework && insights.idealClientFramework.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Ideal Client Identification Framework
                </h2>
                <div className="space-y-4">
                  {insights.idealClientFramework.map((category, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category.category}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {category.description}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {category.needs.map((need, nidx) => (
                          <li key={nidx} className="text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {need}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Prospect Insights ({insights.prospectInsights.length})
              </h2>
              <div className="space-y-8">
                {insights.prospectInsights.map((prospect, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {idx + 1}. {prospect.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {prospect.role}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Profile Notes:
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {prospect.profileNotes}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Three Pitch Suggestions:
                      </h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {prospect.pitchSuggestions.map((suggestion, sidx) => (
                          <li key={sidx} className="text-gray-700 dark:text-gray-300">
                            {suggestion.pitch}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Conversation Starter:
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 italic">
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
  text += "=" .repeat(60) + "\n\n";
  text += `Generated: ${new Date(insights.generatedAt).toLocaleString()}\n\n`;

  if (insights.idealClientFramework && insights.idealClientFramework.length > 0) {
    text += "IDEAL CLIENT IDENTIFICATION FRAMEWORK\n";
    text += "-".repeat(60) + "\n\n";

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
  text += "-".repeat(60) + "\n\n";

  insights.prospectInsights.forEach((prospect, idx) => {
    text += `${idx + 1}. ${prospect.name}\n`;
    text += `   Role: ${prospect.role}\n\n`;
    text += `   Profile Notes:\n   ${prospect.profileNotes}\n\n`;
    text += `   Three Pitch Suggestions:\n`;
    prospect.pitchSuggestions.forEach((suggestion, sidx) => {
      text += `   ${sidx + 1}. ${suggestion.pitch}\n`;
    });
    text += `\n   Conversation Starter:\n   "${prospect.conversationStarter}"\n\n`;
    text += "-".repeat(60) + "\n\n";
  });

  return text;
}
