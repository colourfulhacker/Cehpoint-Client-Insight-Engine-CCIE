"use server";

import { parseExcelFile, parseCSVFile, validateFileType, validateFileSize } from "@/lib/files";
import { generateClientInsights } from "@/lib/gemini";
import { ClientInsightReport } from "@/lib/types";

export interface UploadResult {
  success: boolean;
  message?: string;
  insights?: ClientInsightReport;
  error?: string;
  prospectCount?: number;
  wasTruncated?: boolean;
}

const MAX_PROSPECTS_PER_FILE = 15;

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

    console.log(`[File Processing] Starting analysis of ${file.name}`);

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

    const wasTruncated = leads.length > MAX_PROSPECTS_PER_FILE;
    const prospectCount = leads.length;
    
    if (wasTruncated) {
      console.log(`[File Processing] File contains ${prospectCount} prospects. Processing first ${MAX_PROSPECTS_PER_FILE}...`);
    } else {
      console.log(`[File Processing] Processing ${prospectCount} prospect(s)`);
    }

    const insights = await generateClientInsights(leads);

    let message = `Successfully analyzed ${insights.prospectInsights.length} prospect(s)`;
    if (wasTruncated) {
      message += ` (file contained ${prospectCount} prospects, processed first ${MAX_PROSPECTS_PER_FILE})`;
    }

    return {
      success: true,
      message,
      insights,
      prospectCount,
      wasTruncated,
    };
  } catch (error) {
    console.error("[File Processing Error]:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred while analyzing your file",
    };
  }
}
