import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const embeddingResponse = await fetch(`${WORKER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const { embedding: queryEmbedding } = await embeddingResponse.json();

   const allNotes = await prisma.note.findMany({
      where: {
        status: 'completed'
      },
      select: {
        id: true,
        fileName: true,
        textContent: true,
        embedding: true,
        createdAt: true
      }
    });

    const notes = allNotes.filter(note => note.embedding !== null);

    if (notes.length === 0) {
      return NextResponse.json({
        results: [],
        message: "No notes found. Upload some documents first!"
      });
    }

    const results = notes.map(note => {
      const noteEmbedding = note.embedding as number[];
      const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
      
      return {
        id: note.id,
        fileName: note.fileName,
        textContent: note.textContent.substring(0, 200) + '...', // Preview
        similarity: similarity,
        createdAt: note.createdAt
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    console.log(`✅ Returning top ${topResults.length} results`);
    console.log(`   Best match: ${topResults[0]?.fileName} (${(topResults[0]?.similarity * 100).toFixed(1)}%)`);

    return NextResponse.json({
      query,
      results: topResults,
      total: notes.length
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  if(a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for(let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if(normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}