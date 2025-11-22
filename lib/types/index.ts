export interface LeadRecord {
  name: string;
  role: string;
  company: string;
  location?: string;
  description?: string;
}

export interface PitchSuggestion {
  pitch: string;
}

export interface ProspectInsight {
  name: string;
  role: string;
  company: string;
  location?: string;
  description?: string;
  profileNotes: string;
  pitchSuggestions: PitchSuggestion[];
  conversationStarter: string;
}

export interface ClientInsightReport {
  idealClientFramework: {
    category: string;
    description: string;
    needs: string[];
  }[];
  prospectInsights: ProspectInsight[];
  generatedAt: string;
}
