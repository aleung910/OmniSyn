import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const embeddingResponse = await fetch(`${WORKER_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`Worker failed: ${embeddingResponse.status} - ${errorText}`);
    }

    const { embedding: queryEmbedding } = await embeddingResponse.json();
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Only searches the textEmbedding column (384-dim MiniLM) because the user sent text
    const topResults: any[] = await prisma.$queryRaw`
      SELECT
        id,
        "fileName",
        "textContent",
        1 - ("textEmbedding" <=> ${vectorString}::vector) AS similarity
      FROM "Note"
      WHERE status = 'completed'
        AND "textEmbedding" IS NOT NULL
      ORDER BY "textEmbedding" <=> ${vectorString}::vector
      LIMIT 3;
    `;

    if (topResults.length === 0) {
      return NextResponse.json({
        response:
          "I don't have any notes to reference yet. Please upload some documents first!",
        sources: [],
      });
    }

    const context = topResults
      .map((r, i) => `[Source ${i + 1}: ${r.fileName}]\n${r.textContent}`)
      .join("\n\n---\n\n");


      const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a helpful study assistant. Answer the user's question based on their personal notes.

IMPORTANT: Only use information from the notes provided below. If the notes don't contain relevant information, say so clearly.

User's Notes:
${context}

User's Question: ${message}

Please provide a clear, helpful answer based on the notes above.`,
        },
      ],
    });

    const responseText =
      claudeResponse.content[0].type === "text"
        ? claudeResponse.content[0].text
        : "Unable to generate response";

    return NextResponse.json({
      response: responseText,
      sources: topResults.map((r) => ({
        fileName: r.fileName,
        similarity: Math.round(Number(r.similarity) * 100),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Chat failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}