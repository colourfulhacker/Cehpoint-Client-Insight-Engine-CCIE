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
          const originalCount = leads.length;
          
          // First batch: load 15 prospects immediately
          const INITIAL_BATCH_SIZE = 15;
          const initialBatch = leads.slice(0, INITIAL_BATCH_SIZE);
          const remainingLeads = leads.slice(INITIAL_BATCH_SIZE);

          // Send initial status
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "status",
                message: `Starting analysis of ${initialBatch.length} prospect${initialBatch.length !== 1 ? 's' : ''}${remainingLeads.length > 0 ? ` (file contains ${originalCount} total, loading more in 1 minute)` : ''}`,
                totalProspectsInFile: originalCount,
                currentBatch: 1,
                totalBatches: Math.ceil(originalCount / INITIAL_BATCH_SIZE),
              }) + "\n"
            )
          );

          // Process initial batch in sub-batches
          console.log(`[Streaming Analysis] Processing initial ${initialBatch.length} prospects in batches of ${BATCH_SIZE}`);
          
          for (let i = 0; i < initialBatch.length; i += BATCH_SIZE) {
            const batch = initialBatch.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(initialBatch.length / BATCH_SIZE);

            try {
              const batchInsights = await generateClientInsights(batch);
              allProspects.push(...batchInsights.prospectInsights);

              const progress = Math.round((allProspects.length / originalCount) * 100);

              // Send batch results
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "batch",
                    batchNumber,
                    totalBatches,
                    prospects: batchInsights.prospectInsights,
                    progress,
                    totalProcessed: allProspects.length,
                    totalInFile: originalCount,
                    isProcessing: remainingLeads.length > 0,
                  }) + "\n"
                )
              );

              if (i + BATCH_SIZE < initialBatch.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (batchError) {
              console.error(`[Streaming Analysis] Batch failed:`, batchError);
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "error",
                    message: `Error analyzing batch: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
                  }) + "\n"
                )
              );
            }
          }

          // If there are remaining prospects, start processing them
          if (remainingLeads.length > 0) {
            console.log(`[Streaming Analysis] Initial batch complete. ${remainingLeads.length} prospects queued for next batch in 1 minute...`);
            
            // Send "ready for export" message
            const framework = generateClientFramework(allProspects);
            const exportReport: ClientInsightReport = {
              idealClientFramework: framework,
              prospectInsights: allProspects,
              generatedAt: new Date().toISOString(),
            };

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "batch_complete_available",
                  message: `Loaded ${allProspects.length}/${originalCount} prospects. You can now export available data. Continuing to process remaining ${remainingLeads.length} prospects...`,
                  currentReport: exportReport,
                  totalProcessed: allProspects.length,
                  totalInFile: originalCount,
                  isProcessing: true,
                }) + "\n"
              )
            );

            // Wait 1 minute before processing next batch
            await new Promise(resolve => setTimeout(resolve, 60000));

            // Process remaining prospects in batches of 15
            const remainingBatches = Math.ceil(remainingLeads.length / INITIAL_BATCH_SIZE);
            
            for (let batchIdx = 0; batchIdx < remainingBatches; batchIdx++) {
              const start = batchIdx * INITIAL_BATCH_SIZE;
              const end = Math.min(start + INITIAL_BATCH_SIZE, remainingLeads.length);
              const nextBatch = remainingLeads.slice(start, end);

              console.log(`[Streaming Analysis] Processing batch ${batchIdx + 2}/${remainingBatches + 1}: ${nextBatch.length} prospects`);

              // Process this batch in sub-batches of 5
              for (let i = 0; i < nextBatch.length; i += BATCH_SIZE) {
                const subBatch = nextBatch.slice(i, i + BATCH_SIZE);
                
                try {
                  const batchInsights = await generateClientInsights(subBatch);
                  allProspects.push(...batchInsights.prospectInsights);

                  const progress = Math.round((allProspects.length / originalCount) * 100);

                  // Send batch results
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "batch",
                        prospects: batchInsights.prospectInsights,
                        progress,
                        totalProcessed: allProspects.length,
                        totalInFile: originalCount,
                        isProcessing: allProspects.length < originalCount,
                      }) + "\n"
                    )
                  );

                  await new Promise(resolve => setTimeout(resolve, 500));
                } catch (batchError) {
                  console.error(`[Streaming Analysis] Sub-batch failed:`, batchError);
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "error",
                        message: `Error in batch processing: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`,
                      }) + "\n"
                    )
                  );
                }
              }

              // After each batch group, send updated report for export
              if (allProspects.length < originalCount) {
                const framework = generateClientFramework(allProspects);
                const exportReport: ClientInsightReport = {
                  idealClientFramework: framework,
                  prospectInsights: allProspects,
                  generatedAt: new Date().toISOString(),
                };

                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "batch_complete_available",
                      currentReport: exportReport,
                      totalProcessed: allProspects.length,
                      totalInFile: originalCount,
                      isProcessing: allProspects.length < originalCount,
                    }) + "\n"
                  )
                );
              }

              // Wait before next batch
              if (end < remainingLeads.length) {
                await new Promise(resolve => setTimeout(resolve, 60000));
              }
            }
          }

          // Final completion
          const finalFramework = generateClientFramework(allProspects);
          const finalReport: ClientInsightReport = {
            idealClientFramework: finalFramework,
            prospectInsights: allProspects,
            generatedAt: new Date().toISOString(),
          };

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                report: finalReport,
                totalProcessed: allProspects.length,
                message: `Analysis complete! Processed all ${allProspects.length} prospects.`,
              }) + "\n"
            )
          );

          console.log(`[Streaming Analysis] Analysis complete: ${allProspects.length} prospects`);
          controller.close();
        } catch (error) {
          console.error("[Streaming Analysis] Stream error:", error);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "An unexpected error occurred",
              }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
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
