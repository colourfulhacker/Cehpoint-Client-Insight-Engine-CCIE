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
          responseSchema: {
            type: "object",
            properties: {
              idealClientFramework: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    description: { type: "string" },
                    needs: { type: "array", items: { type: "string" } },
                  },
                  required: ["category", "description", "needs"],
                },
              },
              prospectInsights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string" },
                    profileNotes: { type: "string" },
                    pitchSuggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          pitch: { type: "string" },
                        },
                        required: ["pitch"],
                      },
                    },
                    conversationStarter: { type: "string" },
                  },
                  required: ["name", "role", "profileNotes", "pitchSuggestions", "conversationStarter"],
                },
              },
              generatedAt: { type: "string" },
            },
            required: ["idealClientFramework", "prospectInsights", "generatedAt"],
          },
        },
        contents: userPrompt,
      });

      const rawJson = response.text;
      
      console.log("Gemini API response received successfully");
      
      if (!rawJson) {
        throw new Error("Empty response from Gemini API");
      }

      let insights: ClientInsightReport;
      try {
        insights = JSON.parse(rawJson);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", rawJson.substring(0, 200));
        throw new Error(`Invalid JSON response from Gemini: ${parseError instanceof Error ? parseError.message : "Parse error"}`);
      }
      
      insights.generatedAt = new Date().toISOString();
      
      console.log(`Successfully generated insights for ${insights.prospectInsights.length} prospects`);
      
      return insights;
      
    } catch (error) {
      console.error(`API Key ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error("Unknown error");
      
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
