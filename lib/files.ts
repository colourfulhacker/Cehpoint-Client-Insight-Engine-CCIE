import * as XLSX from "xlsx";
import { LeadRecord } from "./types";

export async function parseExcelFile(file: File): Promise<LeadRecord[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
  
  const leads: LeadRecord[] = jsonData.map((row) => ({
    name: row.name || row.Name || row.NAME || "",
    role: row.role || row.Role || row.ROLE || row.title || row.Title || "",
    company: row.company || row.Company || row.COMPANY || row.organization || "",
    location: row.location || row.Location || row.LOCATION || "",
    description: row.description || row.Description || row.DESCRIPTION || row.profile || row.Profile || "",
  }));
  
  return leads.filter(lead => lead.name && lead.role);
}

export async function parseCSVFile(file: File): Promise<LeadRecord[]> {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: "string" });
  
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
  
  const leads: LeadRecord[] = jsonData.map((row) => ({
    name: row.name || row.Name || row.NAME || "",
    role: row.role || row.Role || row.ROLE || row.title || row.Title || "",
    company: row.company || row.Company || row.COMPANY || row.organization || "",
    location: row.location || row.Location || row.LOCATION || "",
    description: row.description || row.Description || row.DESCRIPTION || row.profile || row.Profile || "",
  }));
  
  return leads.filter(lead => lead.name && lead.role);
}

export function validateFileType(file: File): boolean {
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];
  
  const validExtensions = [".xlsx", ".xls", ".csv"];
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return validTypes.includes(file.type) || hasValidExtension;
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
