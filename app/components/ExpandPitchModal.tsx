"use client";

import { useEffect, useState } from "react";
import { ProspectInsight } from "@/lib/types";

interface ExpandPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: ProspectInsight;
  shortPitch: string;
}

export default function ExpandPitchModal({
  isOpen,
  onClose,
  prospect,
  shortPitch,
}: ExpandPitchModalProps) {
  const [expandedPitch, setExpandedPitch] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      generateExpandedPitch();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
      setExpandedPitch("");
      setError(null);
      setCopied(false);
    }
  }, [isOpen, onClose]);

  const generateExpandedPitch = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/expand-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospect: {
            name: prospect.name,
            role: prospect.role,
            company: prospect.company,
            location: prospect.location,
            description: prospect.description,
          },
          pitch: shortPitch,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate full pitch");
      }

      const data = await response.json();
      setExpandedPitch(data.expandedPitch);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate full pitch"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (expandedPitch) {
      await navigator.clipboard.writeText(expandedPitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRetry = () => {
    generateExpandedPitch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">
                Full Pitch
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {prospect.name} • {prospect.role} at {prospect.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Original Pitch
            </h3>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-gray-800">{shortPitch}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Expanded Pitch
            </h3>

            {isGenerating && (
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 mb-3">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Retry
                </button>
              </div>
            )}

            {!isGenerating && !error && expandedPitch && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  {expandedPitch.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-gray-800 mb-4 last:mb-0 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          {expandedPitch && !isGenerating && !error && (
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Pitch
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
