import { GoogleGenAI } from "@google/genai";
import { LeadRecord, ClientInsightReport } from "./types";

const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY_2 || "",
].filter(key => key.length > 0);

let currentKeyIndex = 0;

function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error("No Gemini API keys configured");
  }
  
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  
  console.log(`Using API key ${currentKeyIndex + 1} of ${API_KEYS.length}`);
  return key;
}

export async function generateClientInsights(
  leads: LeadRecord[]
): Promise<ClientInsightReport> {
  const systemPrompt = `You are a B2B sales and marketing expert for Cehpoint, a custom software development and cybersecurity services company.

Your task is to analyze prospect data and generate actionable insights for marketing interns to approach these leads effectively.

For each prospect, provide:
1. Profile Notes: Brief analysis of their role, company, and potential needs
2. Three Pitch Suggestions: Specific service offerings from Cehpoint that would appeal to them
3. Conversation Starter: A personalized opening message

Cehpoint's services include:
- Custom software development
- Architecture improvement and re-engineering
- Security hardening and compliance (HIPAA, SOC2, etc.)
- AI feature implementation
- DevSecOps, CI/CD, cloud optimization
- Dedicated engineering teams
- White-label development services
- Security audits and penetration testing

Respond with a JSON object following this exact structure:
{
  "idealClientFramework": [
    {
      "category": "Category name (e.g., 'Founders / Co-Founders')",
      "description": "Brief description of this client type",
      "needs": ["need 1", "need 2", "need 3"]
    }
  ],
  "prospectInsights": [
    {
      "name": "Prospect name",
      "role": "Their role",
      "profileNotes": "Analysis of their needs and situation",
      "pitchSuggestions": [
        {"pitch": "First pitch suggestion"},
        {"pitch": "Second pitch suggestion"},
        {"pitch": "Third pitch suggestion"}
      ],
      "conversationStarter": "Personalized opening message"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;

  const userPrompt = `Analyze these ${leads.length} prospects and generate insights:\n\n${JSON.stringify(leads, null, 2)}`;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      const apiKey = getNextApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      console.log(`Analyzing ${leads.length} prospects with Gemini API (attempt ${attempt + 1}/${API_KEYS.length})...`);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });

      // Extract text from response - handle different response formats
      let rawJson: string | null = null;
      
      // Try multiple ways to access the response text
      if ((response as any)?.text) {
        rawJson = (response as any).text;
      } else if ((response as any)?.response?.text) {
        rawJson = (response as any).response.text;
      } else if ((response as any)?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawJson = (response as any).candidates[0].content.parts[0].text;
      }
      
      if (!rawJson) {
        console.error("Failed to extract text from response:", {
          hasText: !!(response as any)?.text,
          hasResponseText: !!(response as any)?.response?.text,
          hasCandidates: !!(response as any)?.candidates,
          keys: Object.keys(response || {}),
        });
        throw new Error("Could not extract text from Gemini API response");
      }
      
      console.log("Extracted response, parsing JSON...");
      
      // Parse the JSON
      const insights: ClientInsightReport = JSON.parse(rawJson);
      insights.generatedAt = new Date().toISOString();
      
      console.log(`Successfully generated insights for ${insights.prospectInsights.length} prospects`);
      return insights;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`API Key ${attempt + 1} failed:`, errorMsg);
      console.error("Full error:", error);
      lastError = error instanceof Error ? error : new Error(errorMsg);
      
      if (attempt < API_KEYS.length - 1) {
        console.log("Trying next API key...");
        continue;
      }
    }
  }
  
  if (lastError) {
    throw new Error(`All API keys exhausted. Last error: ${lastError.message}`);
  }
  
  throw new Error("Failed to generate insights: No API keys available");
}
