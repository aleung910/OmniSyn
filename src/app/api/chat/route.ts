import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
        
    try {
      const embeddingResponse = await fetch(`${WORKER_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        throw new Error(`Worker failed: ${embeddingResponse.status} - ${errorText}`);
      }

      const { embedding: queryEmbedding } = await embeddingResponse.json();

      //  Search for relevant notes
      const allNotes = await prisma.note.findMany({
        where: { status: 'completed' },
        select: {
          id: true,
          fileName: true,
          textContent: true,
          embedding: true,
        }
      });

      const notes = allNotes.filter(note => note.embedding !== null);

      if (notes.length === 0) {
        return NextResponse.json({
          response: "I don't have any notes to reference yet. Please upload some documents first!"
        });
      }

      //Calculate similarity scores
      const results = notes.map(note => {
        const noteEmbedding = note.embedding as number[];
        const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
        
        return {
          fileName: note.fileName,
          textContent: note.textContent,
          similarity: similarity
        };
      });

      results.sort((a, b) => b.similarity - a.similarity);
      const topResults = results.slice(0, 3);

      // topResults.forEach((r, i) => {
      //   console.log(`   ${i + 1}. ${r.fileName} (${(r.similarity * 100).toFixed(1)}%)`);
      // });

      //Build context from relevant notes
      const context = topResults
        .map((r, i) => `[Source ${i + 1}: ${r.fileName}]\n${r.textContent}`)
        .join('\n\n---\n\n');
      
      const claudeResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a helpful study assistant. Answer the user's question based on their personal notes.

IMPORTANT: Only use information from the notes provided below. If the notes don't contain relevant information, say so.

User's Notes:
${context}

User's Question: ${message}

Please provide a clear, helpful answer based on the notes above.`
        }]
      });

      const responseText = claudeResponse.content[0].type === 'text' 
        ? claudeResponse.content[0].text 
        : 'Unable to generate response';

      return NextResponse.json({
        response: responseText,
        sources: topResults.map(r => ({
          fileName: r.fileName,
          similarity: Math.round(r.similarity * 100)
        }))
      });

    } catch (workerError) {
      return NextResponse.json({
        error: "Failed to process query. Make sure the worker is running.",
        details: workerError instanceof Error ? workerError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json(
      {
        error: "Chat failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if(a.length !== b.length){
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}