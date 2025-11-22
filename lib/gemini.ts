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
  const systemPrompt = `You are an expert B2B sales strategist specializing in software development, infrastructure, and cybersecurity solutions. Your role is to analyze prospect data and create deeply personalized, actionable sales insights that help outreach teams succeed.

COMPANY CONTEXT:
Cehpoint is a premium custom software development and cybersecurity services firm serving technology leaders and founders. We deliver:

CORE SERVICES:
- Enterprise-scale custom software development & architecture design
- Security hardening, compliance (HIPAA, SOC2, PCI-DSS, ISO 27001) & penetration testing
- Cloud infrastructure optimization, DevSecOps, CI/CD pipeline design
- AI/ML feature implementation & technical innovation
- Dedicated engineering team augmentation & overflow capacity
- Security audits, architecture reviews & re-engineering

IDEAL CLIENT FRAMEWORK:

A. FOUNDERS / CO-FOUNDERS (Tech-Led Companies)
   Characteristics: Active product development, scaling challenges, rapid growth
   Pain Points: Need stable architecture, security hardening, rapid feature delivery, compliance
   Key Services Match: Custom dev, architecture optimization, security implementation
   
B. CTOs / TECHNICAL HEADS (Enterprise Technology Leaders)  
   Characteristics: Own tech stack decisions, security responsibility, growth through scaling
   Pain Points: Engineering capacity gaps, DevSecOps needs, secure development practices
   Key Services Match: Dedicated teams, DevSecOps, security reviews, architecture modernization
   
C. CEOs / FOUNDERS OF IT SERVICES FIRMS
   Characteristics: Run dev/consulting shops, need overflow capacity, serve compliance-heavy clients
   Pain Points: Scaling delivery capacity, white-label solutions, security certifications
   Key Services Match: White-label development, overflow teams, security audits
   
D. INFRASTRUCTURE / CLOUD SPECIALISTS
   Characteristics: Cloud infrastructure focus, DevOps background, security-conscious
   Pain Points: Cost optimization, secure architecture, team bandwidth
   Key Services Match: Cloud optimization, DevSecOps, security implementation

ANALYSIS REQUIREMENTS:

For EACH prospect, analyze their role and company to provide:

1. PROFILE NOTES (2-3 sentences):
   - Identify their specific industry/company context
   - Determine their likely technical challenges based on role
   - Reference what specific services would address their situation
   - Be concrete, not generic

2. THREE PITCH SUGGESTIONS (highly targeted, business-outcome focused):
   - Each pitch addresses a specific, valuable business outcome
   - Pitch 1: Most obvious/urgent business need from their role
   - Pitch 2: Secondary valuable benefit complementing Pitch 1  
   - Pitch 3: Unique strategic advantage or partnership opportunity
   - Format: 1-2 sentences each, specific to their context
   - Avoid mentioning "services" - focus on outcomes (speed, security, reliability, growth)

3. CONVERSATION STARTER (personalized opening message):
   - Show understanding of their specific role and company context
   - Reference something concrete about their business
   - Position Cehpoint as a strategic partner solving their real problems
   - End with an open question that invites conversation
   - 2-3 sentences max

CLASSIFICATION RULES:
- Identify the 2-4 primary ideal client categories present in this batch
- For each category, extract 3 key needs from the prospect profiles
- Use the ideal client framework above as reference
- Only include categories that are actually represented in the data

OUTPUT FORMAT (STRICT JSON - NO MARKDOWN, NO EXTRA TEXT):

{
  "idealClientFramework": [
    {
      "category": "Category name (e.g., 'Founders / Co-Founders of Tech Companies')",
      "description": "Brief description of this prospect type and their primary challenges",
      "needs": ["Specific need 1", "Specific need 2", "Specific need 3"]
    }
  ],
  "prospectInsights": [
    {
      "name": "Full name",
      "role": "Their exact role",
      "profileNotes": "Specific analysis of their context and how services align",
      "pitchSuggestions": [
        {"pitch": "Pitch 1 - addressing specific business outcome"},
        {"pitch": "Pitch 2 - addressing secondary but valuable outcome"},
        {"pitch": "Pitch 3 - strategic partnership angle"}
      ],
      "conversationStarter": "Personalized message showing you understand their context"
    }
  ],
  "generatedAt": "ISO 8601 timestamp"
}

QUALITY STANDARDS:
- Every detail must be specific to the prospect - no generic statements
- Pitches must be business-outcome driven (time-to-market, security posture, team capacity, cost)
- Each pitch must be distinctly different from the others
- Profile notes must reference actual aspects of their role/company
- Personalization is critical - show you understand their specific situation
- Keep language professional and business-focused
- NEVER mention AI, automation, or methodology - focus on business value`;

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
