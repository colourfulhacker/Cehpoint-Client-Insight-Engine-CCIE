import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProspectSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  profile: z.string().optional(),
});

const PitchSuggestionSchema = z.object({
  pitch: z.string(),
  reasoning: z.string().optional(),
});

const ProspectInsightSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string(),
  profileNotes: z.string(),
  pitchSuggestions: z.array(PitchSuggestionSchema).length(3),
  conversationStarter: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prospect = ProspectSchema.parse(body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert B2B sales strategist specializing in personalized outreach for Cehpoint's services.

CEHPOINT - PREMIUM SERVICES FIRM:
We deliver enterprise-scale solutions:
- Custom software development & architecture modernization
- Security implementation: HIPAA, SOC2, PCI-DSS, ISO 27001 compliance
- Infrastructure optimization: Cloud, DevSecOps, CI/CD automation
- AI/ML integration & technical innovation
- Overflow engineering capacity & dedicated technical teams
- Security audits, architecture reviews, penetration testing

IDEAL CLIENT FRAMEWORK:
1. Startup Founders/CEOs - Need: Speed, reliability, cost control
2. CTOs/VPs Engineering - Need: Security, scalability, DevOps efficiency  
3. IT Service Company CEOs - Need: Multi-client infrastructure, capacity
4. Infrastructure/Platform Specialists - Need: Performance, compliance, stability

CRITICAL REQUIREMENTS:
- Focus on BUSINESS OUTCOMES (revenue, security, capacity, speed)
- Reference prospect's SPECIFIC role/company context
- NO generic advice - be prospect-specific
- Pitches must feel like you researched this person
- Each pitch must be completely different, not variations
- Quality > Templates

OUTPUT: Strict JSON with prospect-level insights.`;

    const userPrompt = `Generate fresh pitch suggestions for this prospect:

Name: ${prospect.name}
Role: ${prospect.role}
Company: ${prospect.company}
${prospect.location ? `Location: ${prospect.location}` : ""}
${prospect.description ? `Description: ${prospect.description}` : ""}
${prospect.profile ? `Profile: ${prospect.profile}` : ""}

Return ONLY valid JSON with this exact structure:
{
  "name": "${prospect.name}",
  "role": "${prospect.role}",
  "company": "${prospect.company}",
  "profileNotes": "2-3 sentences analyzing prospect's likely priorities based on role/company",
  "pitchSuggestions": [
    { "pitch": "First pitch approach focused on specific business outcome" },
    { "pitch": "Second pitch approach from different angle" },
    { "pitch": "Third pitch approach with unique value proposition" }
  ],
  "conversationStarter": "Personalized opening message showing understanding of their context"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.8,
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    let rawJson: string | null = null;
    
    if ((response as any)?.text) {
      rawJson = (response as any).text;
    } else if ((response as any)?.response?.text) {
      rawJson = (response as any).response.text;
    } else if ((response as any)?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawJson = (response as any).candidates[0].content.parts[0].text;
    }
    
    if (!rawJson) {
      throw new Error("Failed to extract response from Gemini API");
    }
    
    const cleanedJson = rawJson.trim();
    const parsedResponse = JSON.parse(cleanedJson);
    const validatedInsight = ProspectInsightSchema.parse(parsedResponse);

    return NextResponse.json(validatedInsight);
  } catch (error) {
    console.error("Regenerate pitch error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to regenerate pitch" },
      { status: 500 }
    );
  }
}
