"use server";

import { parseExcelFile, parseCSVFile, validateFileType, validateFileSize } from "@/lib/files";
import { generateClientInsights } from "@/lib/gemini";
import { ClientInsightReport } from "@/lib/types";

export interface UploadResult {
  success: boolean;
  message?: string;
  insights?: ClientInsightReport;
  error?: string;
}

export async function processLeadFile(
  formData: FormData
): Promise<UploadResult> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    if (!validateFileType(file)) {
      return {
        success: false,
        error: "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.",
      };
    }

    if (!validateFileSize(file, 10)) {
      return {
        success: false,
        error: "File size too large. Maximum size is 10MB.",
      };
    }

    let leads;
    if (file.name.toLowerCase().endsWith(".csv")) {
      leads = await parseCSVFile(file);
    } else {
      leads = await parseExcelFile(file);
    }

    if (leads.length === 0) {
      return {
        success: false,
        error: "No valid prospect data found in the file. Please ensure your file has columns for name, role, and company.",
      };
    }

    const insights = await generateClientInsights(leads);

    return {
      success: true,
      message: `Successfully analyzed ${leads.length} prospects`,
      insights,
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
