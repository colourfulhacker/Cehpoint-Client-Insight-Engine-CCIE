import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile, parseCSVFile, validateFileType, validateFileSize } from "@/lib/files";
import { generateClientInsights } from "@/lib/gemini";
import { ClientInsightReport, ProspectInsight } from "@/lib/types";

const BATCH_SIZE = 5;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!validateFileType(file)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file." },
        { status: 400 }
      );
    }

    if (!validateFileSize(file, 10)) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log(`[Streaming Analysis] Starting file: ${file.name}`);

    // Parse file
    let leads;
    if (file.name.toLowerCase().endsWith(".csv")) {
      leads = await parseCSVFile(file);
    } else {
      leads = await parseExcelFile(file);
    }

    if (leads.length === 0) {
      return NextResponse.json(
        { error: "No valid prospect data found in the file." },
        { status: 400 }
      );
    }

    console.log(`[Streaming Analysis] Parsed ${leads.length} valid prospects, processing in batches of ${BATCH_SIZE}`);

    // Create ReadableStream for streaming responses
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const allProspects: ProspectInsight[] = [];
          const wasTruncated = leads.length > 15;
          const originalCount = leads.length;

          // Limit to 15 total
          const leadsToProcess = leads.slice(0, 15);

          // Send initial status
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "status",
                message: `Starting analysis of ${leadsToProcess.length} prospect${leadsToProcess.length !== 1 ? 's' : ''}${wasTruncated ? ` (file contained ${originalCount}, processing first 15)` : ''}`,
                total: leadsToProcess.length,
                batches: Math.ceil(leadsToProcess.length / BATCH_SIZE),
              }) + "\n"
            )
          );

          // Process in batches
          for (let i = 0; i < leadsToProcess.length; i += BATCH_SIZE) {
            const batch = leadsToProcess.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`[Streaming Analysis] Processing batch ${batchNumber}: ${batch.length} prospects`);

            try {
              // Analyze this batch
              const batchInsights = await generateClientInsights(batch);

              // Add prospects to accumulated list
              allProspects.push(...batchInsights.prospectInsights);

              // Send batch results with progress
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "batch",
                    batchNumber,
                    totalBatches: Math.ceil(leadsToProcess.length / BATCH_SIZE),
                    prospects: batchInsights.prospectInsights,
                    progress: Math.round((allProspects.length / leadsToProcess.length) * 100),
                  }) + "\n"
                )
              );

              console.log(`[Streaming Analysis] Batch ${batchNumber} complete: ${batchInsights.prospectInsights.length} prospects analyzed`);
            } catch (batchError) {
              console.error(`[Streaming Analysis] Batch ${batchNumber} failed:`, batchError);
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    message: `Error analyzing batch ${batchNumber}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
                  }) + "\n"
                )
              );
            }
          }

          // Send completion with full results
          const finalReport: ClientInsightReport = {
            idealClientFramework: generateClientFramework(allProspects),
            prospectInsights: allProspects,
            generatedAt: new Date().toISOString(),
          };

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                report: finalReport,
                totalProcessed: allProspects.length,
              }) + "\n"
            )
          );

          console.log(`[Streaming Analysis] Analysis complete: ${allProspects.length} prospects`);
          controller.close();
        } catch (error) {
          console.error("[Streaming Analysis] Stream error:", error);
          const stream = this as any;
          if (stream.controller) {
            stream.controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  message: error instanceof Error ? error.message : "An unexpected error occurred",
                }) + "\n"
              )
            );
            stream.controller.close();
          }
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("[Streaming Analysis] Request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function generateClientFramework(prospects: ProspectInsight[]) {
  // Analyze roles and create framework categories
  const roleMap = new Map<string, number>();

  prospects.forEach((p) => {
    const role = p.role.split(/[,/]|and/)[0].trim().toLowerCase();
    roleMap.set(role, (roleMap.get(role) || 0) + 1);
  });

  // Create categories from top roles
  const categories = Array.from(roleMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([role]) => ({
      category: `${role.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Decision Makers`,
      description: `Professionals in ${role} roles typically manage technology, security, and business development initiatives`,
      needs: [
        "Secure, scalable technology solutions",
        "Risk mitigation and compliance",
        "Team augmentation and expertise",
      ],
    }));

  return categories.length > 0
    ? categories
    : [
        {
          category: "Technology Leaders",
          description: "Executives responsible for technology strategy and implementation",
          needs: ["Secure, scalable solutions", "Risk mitigation", "Team augmentation"],
        },
      ];
}
