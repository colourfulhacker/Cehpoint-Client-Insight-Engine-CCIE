"use client";

import { useState, useEffect } from "react";
import { ProspectInsight } from "@/lib/types";

interface RegeneratePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: ProspectInsight;
  onRegenerate: (updatedProspect: ProspectInsight) => void;
}

export default function RegeneratePitchModal({
  isOpen,
  onClose,
  prospect,
  onRegenerate,
}: RegeneratePitchModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/regenerate-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prospect),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate pitches");
      }

      const updatedProspect: ProspectInsight = await response.json();
      onRegenerate(updatedProspect);
      onClose();
    } catch (err) {
      console.error("Regeneration error:", err);
      setError("Failed to regenerate pitches. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Regenerate Pitch Suggestions
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-4">
              {/* Prospect Info */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-1">{prospect.name}</h4>
                <p className="text-sm text-gray-600">{prospect.role}</p>
                <p className="text-sm text-gray-500">{prospect.company}</p>
              </div>

              {/* Current Pitches */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Current Pitch Suggestions
                </h4>
                <div className="space-y-2">
                  {prospect.pitchSuggestions.map((pitch, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex gap-2">
                        <span className="text-sm font-medium text-gray-500 flex-shrink-0">
                          {idx + 1}.
                        </span>
                        <p className="text-sm text-gray-700">{pitch.pitch}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Message */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    This will generate 3 completely new pitch variations for {prospect.name}. The current pitches will be replaced with fresh ideas.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isRegenerating}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isRegenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generate New Pitches
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
