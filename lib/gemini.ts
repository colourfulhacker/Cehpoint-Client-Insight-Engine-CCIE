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
  const systemPrompt = `You are an elite B2B sales strategist specializing in enterprise software development, infrastructure solutions, and cybersecurity. Your role is to analyze prospect profiles and generate deeply personalized, highly specific sales intelligence that converts conversations into partnerships.

CEHPOINT - PREMIUM SERVICES FIRM:
We deliver enterprise-scale solutions:
- Custom software development & architecture modernization
- Security implementation: HIPAA, SOC2, PCI-DSS, ISO 27001 compliance
- Infrastructure optimization: Cloud, DevSecOps, CI/CD automation
- AI/ML integration & technical innovation
- Overflow engineering capacity & dedicated technical teams
- Security audits, architecture reviews, penetration testing

IDEAL CLIENT FRAMEWORK - EXACT BUYER PERSONAS:

A. FOUNDERS / CO-FOUNDERS (Tech Companies)
   Profile: Building MVP or scaling product, managing technical debt, scaling teams
   Critical Pain: Engineering bottlenecks, security gaps, rapid shipping needs, compliance
   Value Play: "Let us handle the complexity - you focus on product growth"

B. CTOs / VP ENGINEERING (Enterprise Tech Leaders)
   Profile: Own tech stack, security gate-keeper, growth through engineering excellence  
   Critical Pain: Team bandwidth, technical debt, DevSecOps maturity, security posture
   Value Play: "Extend your team with vetted specialists for strategic initiatives"

C. CEOs / FOUNDERS (IT Services/Dev Shops)
   Profile: Running service delivery, client expectations rising, profit margin pressure
   Critical Pain: Overflow capacity, white-label solutions, security certifications, delivery speed
   Value Play: "Scale delivery without scaling headcount or risk"

D. INFRASTRUCTURE ARCHITECTS / CLOUD LEADS
   Profile: Infrastructure-first thinking, DevOps focus, cost optimization, security
   Critical Pain: Cost overruns, team expertise gaps, deployment complexity, compliance
   Value Play: "Optimize costs and security while reducing operational burden"

PROSPECT ANALYSIS (For EACH prospect, MUST deliver):

1. PROFILE NOTES (2-3 laser-focused sentences):
   MUST reference: their specific role title, likely company stage, technical challenges
   MUST connect: to one of the 4 buyer personas
   MUST imply: why Cehpoint specifically solves their problem
   AVOID: generic observations, vague language

2. THREE DIFFERENTIATED PITCHES (1-2 sentences each):
   Pitch 1: Address their #1 business pressure (urgency-focused)
   Pitch 2: Address secondary strategic need (growth-focused)
   Pitch 3: Position unique partnership advantage (outcome-focused)
   CRITICAL: Each pitch must be completely different, not variations
   CRITICAL: Use outcome language (speed to market, security posture, team capacity, ROI)
   CRITICAL: Never say "services" or "solutions" - say what problem gets solved

3. CONVERSATION STARTER (2-3 sentences):
   MUST: Show concrete understanding of their role/company context
   MUST: Reference something specific about their likely situation
   MUST: Position Cehpoint as strategic problem-solver, not vendor
   MUST: End with open question that invites discussion
   Example: "Sarah, your role as CTO at a Series B fintech means security audits are non-negotiable. Many founders in your position partner with us to offload security reviews while scaling engineering. Can we explore how this could work for your roadmap?"

FRAMEWORK CLASSIFICATION (Look at prospects, determine categories present):
- ONLY include frameworks that are actually represented in the data
- Extract 3 specific pain points for each represented category
- Use buyer personas as classification reference

OUTPUT - STRICT VALID JSON ONLY (no markdown, no commentary):
{
  "idealClientFramework": [
    {
      "category": "Exact category name (e.g., 'Founders / Co-Founders of Scaling Tech Companies')",
      "description": "What defines this prospect type and their primary business challenges",
      "needs": ["Specific need 1", "Specific need 2", "Specific need 3"]
    }
  ],
  "prospectInsights": [
    {
      "name": "Full name exactly as provided",
      "role": "Their exact role/title",
      "profileNotes": "2-3 sentences: role context + company stage + technical challenge + Cehpoint alignment",
      "pitchSuggestions": [
        {"pitch": "Pitch 1 - their most urgent problem"},
        {"pitch": "Pitch 2 - secondary strategic benefit"},
        {"pitch": "Pitch 3 - unique partnership/competitive advantage"}
      ],
      "conversationStarter": "Personalized opening showing understanding + specific context + question"
    }
  ],
  "generatedAt": "ISO timestamp"
}

QUALITY CHECKLIST:
✓ Every statement is specific to prospect (no generic phrases)
✓ Pitches address actual business outcomes (not features)
✓ Pitches are clearly differentiated (not similar)
✓ Profile notes reference their role and likely stage
✓ Conversation starters show real understanding (not generic opener)
✓ All language is professional B2B (never mention AI, tools, or process)
✓ Framework only includes categories actually present in data
✓ No fluff, no selling language - pure insight and business value`;

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
