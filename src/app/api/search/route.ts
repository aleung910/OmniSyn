import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Get the query embedding from the worker (MiniLM, 384-dim)
    const embeddingResponse = await fetch(`${WORKER_URL}/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query }),
    });

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate query embedding");
    }

    const { embedding: queryEmbedding } = await embeddingResponse.json();
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Let PostgreSQL do the similarity math — no more JS cosine loops
    // <=> is cosine distance, so 1 - distance = similarity score
    const results: any[] = await prisma.$queryRaw`
      SELECT
        id,
        "fileName",
        LEFT("textContent", 200) AS "textContent",
        "createdAt",
        1 - ("textEmbedding" <=> ${vectorString}::vector) AS similarity
      FROM "Note"
      WHERE status = 'completed'
        AND "textEmbedding" IS NOT NULL
      ORDER BY "textEmbedding" <=> ${vectorString}::vector
      LIMIT ${Number(limit)};
    `;

    if (results.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No notes found. Upload some documents first!",
      });
    }

    console.log(`✅ Returning top ${results.length} results`);
    console.log(
      `   Best match: ${results[0]?.fileName} (${(Number(results[0]?.similarity) * 100).toFixed(1)}%)`
    );

    return NextResponse.json({
      query,
      results,
      total: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}