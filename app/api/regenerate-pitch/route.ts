import { NextResponse } from "next/server";
import { z } from "zod";
import { geminiClient } from "@/lib/gemini-client";
import { RateLimitError, ValidationError as CustomValidationError } from "@/lib/errors";
import { sleep } from "@/lib/retry";

const MAX_RATE_LIMIT_RETRIES = 10;

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
  location: z.string().optional(),
  description: z.string().optional(),
  profileNotes: z.string(),
  pitchSuggestions: z.array(PitchSuggestionSchema).length(3),
  conversationStarter: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prospect = ProspectSchema.parse(body);


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
  "name": ${JSON.stringify(prospect.name)},
  "role": ${JSON.stringify(prospect.role)},
  "company": ${JSON.stringify(prospect.company)},${prospect.location ? `\n  "location": ${JSON.stringify(prospect.location)},` : ""}${prospect.description ? `\n  "description": ${JSON.stringify(prospect.description)},` : ""}
  "profileNotes": "2-3 sentences analyzing prospect's likely priorities based on role/company",
  "pitchSuggestions": [
    { "pitch": "First pitch approach focused on specific business outcome" },
    { "pitch": "Second pitch approach from different angle" },
    { "pitch": "Third pitch approach with unique value proposition" }
  ],
  "conversationStarter": "Personalized opening message showing understanding of their context"
}`;

    for (let rateLimitRetry = 0; rateLimitRetry < MAX_RATE_LIMIT_RETRIES; rateLimitRetry++) {
      try {
        const rawJson = await geminiClient.callWithRetry({
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt,
          userPrompt,
          temperature: 0.8,
          responseMimeType: "application/json",
        });

        const parsedResponse = JSON.parse(rawJson);
        const validatedInsight = ProspectInsightSchema.parse(parsedResponse);

        // Preserve optional fields from the request
        const enrichedInsight = {
          ...validatedInsight,
          location: prospect.location,
          description: prospect.description,
        };

        return NextResponse.json(enrichedInsight);
      } catch (error) {
        if (error instanceof RateLimitError && rateLimitRetry < MAX_RATE_LIMIT_RETRIES - 1) {
          const waitTime = (error.retryAfter || 60) * 1000;
          console.log(`[Regenerate Pitch] All keys on cooldown. Waiting ${error.retryAfter || 60}s before retry (attempt ${rateLimitRetry + 1}/${MAX_RATE_LIMIT_RETRIES})...`);
          await sleep(waitTime);
          continue;
        }
        
        throw error;
      }
    }
  } catch (error) {
    console.error("Regenerate pitch error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please wait and try again.",
          retryAfter: error.retryAfter,
        },
        { status: 429 }
      );
    }

    if (error instanceof CustomValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate pitch" },
      { status: 500 }
    );
  }
}
