import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

const ProspectContextSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const ExpandPitchRequestSchema = z.object({
  prospect: ProspectContextSchema,
  pitch: z.string(),
});

const ExpandedPitchResponseSchema = z.object({
  expandedPitch: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prospect, pitch } = ExpandPitchRequestSchema.parse(body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert B2B sales copywriter specializing in crafting compelling, personalized outreach for Cehpoint's premium services.

CEHPOINT - PREMIUM SERVICES FIRM:
We deliver enterprise-scale solutions:
- Custom software development & architecture modernization
- Security implementation: HIPAA, SOC2, PCI-DSS, ISO 27001 compliance
- Infrastructure optimization: Cloud, DevSecOps, CI/CD automation
- AI/ML integration & technical innovation
- Overflow engineering capacity & dedicated technical teams
- Security audits, architecture reviews, penetration testing

WRITING GUIDELINES:
- Professional, confident tone without being pushy
- Focus on business outcomes and ROI
- Address specific pain points based on prospect's role/company
- Include concrete examples or scenarios when relevant
- Keep it conversational yet professional
- 2-3 well-structured paragraphs (200-250 words total)
- End with a soft call-to-action or next step

OUTPUT: Return ONLY valid JSON with the expanded pitch.`;

    const userPrompt = `Expand this short pitch into a full, detailed outreach message:

SHORT PITCH: ${pitch}

PROSPECT CONTEXT:
Name: ${prospect.name}
Role: ${prospect.role}
Company: ${prospect.company}
${prospect.location ? `Location: ${prospect.location}` : ""}
${prospect.description ? `Description: ${prospect.description}` : ""}

Create a compelling 2-3 paragraph pitch (200-250 words) that:
1. Opens with understanding of their specific situation/challenges
2. Explains how Cehpoint solves their problem with concrete benefits
3. Ends with a natural next step or question

Return ONLY valid JSON with this exact structure:
{
  "expandedPitch": "Full multi-paragraph pitch text here. Use \\n\\n to separate paragraphs."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
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
    const validatedResponse =
      ExpandedPitchResponseSchema.parse(parsedResponse);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Expand pitch error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate expanded pitch" },
      { status: 500 }
    );
  }
}
