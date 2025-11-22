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
  
  console.log(`[Gemini API] Using API key ${currentKeyIndex} of ${API_KEYS.length}`);
  return key;
}

export async function generateClientInsights(
  leads: LeadRecord[]
): Promise<ClientInsightReport> {
  const systemPrompt = `You are an expert B2B sales strategist specializing in enterprise software solutions. Your role is to analyze prospect data and create highly targeted, actionable insights for sales professionals.

COMPANY CONTEXT:
Cehpoint is a premier custom software development and cybersecurity services firm. We solve critical business problems through:
- Enterprise-scale custom software development
- Security hardening and compliance (HIPAA, SOC2, PCI-DSS, ISO 27001)
- Architecture modernization and cloud migration
- AI/ML feature implementation
- DevSecOps and CI/CD optimization
- Dedicated engineering team augmentation
- Security audits and penetration testing

ANALYSIS REQUIREMENTS:

For EACH prospect, provide:

1. Profile Notes (2-3 sentences max):
   - Identify their likely business challenges based on role and company
   - Assess how Cehpoint's services align with their needs
   - Be specific and avoid generic statements

2. Pitch Suggestions (3 highly targeted pitches):
   - First pitch: Address their most obvious business need
   - Second pitch: Highlight a secondary but valuable benefit
   - Third pitch: Unique differentiator or complementary service
   - Each pitch must be 1-2 sentences, specific, and actionable

3. Conversation Starter:
   - Personalized opening that shows you understand their context
   - Include something specific about their role/company
   - Position Cehpoint as a solution partner, not a vendor
   - Keep to 1-2 sentences

CLASSIFICATION RULES:

Identify client categories based on the prospects:
- Group similar prospects by role, company size, or industry vertical
- Create 2-4 client personas that represent the group
- For each persona, list 3 key business needs they likely have

OUTPUT FORMAT (STRICT JSON):

{
  "idealClientFramework": [
    {
      "category": "Persona name (e.g., 'CTO at Mid-Market B2B SaaS')",
      "description": "Brief description of this prospect type and their challenges",
      "needs": ["Need 1", "Need 2", "Need 3"]
    }
  ],
  "prospectInsights": [
    {
      "name": "Full name",
      "role": "Their exact role",
      "profileNotes": "Specific analysis of their business context and how Cehpoint helps",
      "pitchSuggestions": [
        {"pitch": "Targeted pitch 1"},
        {"pitch": "Targeted pitch 2"},
        {"pitch": "Targeted pitch 3"}
      ],
      "conversationStarter": "Personalized opening message"
    }
  ],
  "generatedAt": "ISO 8601 timestamp"
}

QUALITY GUIDELINES:
- Be precise and specific - no generic advice
- Focus on business outcomes, not features
- Ensure pitches are differentiated from each other
- Personalization must reference actual prospect data
- Avoid mentioning AI, technology jargon, or methodology
- Keep recommendations actionable and immediate`;

  const userPrompt = `Analyze these ${leads.length} prospect(s) and generate strategic sales insights.

PROSPECT DATA:
${JSON.stringify(leads, null, 2)}

CRITICAL REQUIREMENTS:
1. Respond ONLY with valid JSON - no markdown, no extra text
2. Each prospect gets exactly 3 unique, targeted pitches
3. All text must be professional and sales-ready
4. Profile notes must reference specific aspects of their role/company
5. Conversation starters must be personalized and specific
6. Include 2-4 ideal client framework categories based on the prospects provided`;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      const apiKey = getNextApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      console.log(`[Gemini API] Analyzing ${leads.length} prospect(s) (attempt ${attempt + 1}/${API_KEYS.length})...`);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7, // Balanced for creativity and consistency
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });

      // Extract text from response
      let rawJson: string | null = null;
      
      if ((response as any)?.text) {
        rawJson = (response as any).text;
      } else if ((response as any)?.response?.text) {
        rawJson = (response as any).response.text;
      } else if ((response as any)?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawJson = (response as any).candidates[0].content.parts[0].text;
      }
      
      if (!rawJson) {
        console.error("[Gemini API] Could not extract text from response");
        throw new Error("Failed to extract response from Gemini API");
      }
      
      console.log("[Gemini API] Parsing JSON response...");
      
      // Clean and parse JSON
      const cleanedJson = rawJson.trim();
      const insights: ClientInsightReport = JSON.parse(cleanedJson);
      insights.generatedAt = new Date().toISOString();
      
      console.log(`[Gemini API] ✓ Successfully generated insights for ${insights.prospectInsights.length} prospect(s)`);
      return insights;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Gemini API] Key ${attempt + 1} failed: ${errorMsg}`);
      lastError = error instanceof Error ? error : new Error(errorMsg);
      
      if (attempt < API_KEYS.length - 1) {
        console.log("[Gemini API] Retrying with next key...");
        continue;
      }
    }
  }
  
  const errorMessage = lastError?.message || "Unknown error";
  console.error(`[Gemini API] All keys exhausted. Final error: ${errorMessage}`);
  throw new Error(`Failed to generate insights: ${errorMessage}`);
}
