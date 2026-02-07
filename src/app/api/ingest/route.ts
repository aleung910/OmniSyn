import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:3001";

export async function POST(req: Request) {
  try {
    
    const formData = await req.formData();
    const files: File[] = formData.getAll('files').filter(value => value instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const jobID = crypto.randomUUID();

    const filesData = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        
        return {
          name: file.name,
          type: file.type,
          data: base64
        };
      })
    );

    console.log(`💾 Creating ${filesData.length} database records...`);
    await Promise.all(
      filesData.map(async (file) => {
        await prisma.note.create({
          data: {
            jobId: jobID,
            fileName: file.name,
            fileType: file.type,
            textContent: "Processing...",
            status: "processing"
          }
        });
      })
    );

    try {
      const workerResponse = await fetch(`${WORKER_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobID,
          files: filesData
        })
      });

      if (!workerResponse.ok) {
        const errorText = await workerResponse.text();
        console.error('Worker error:', errorText);
        throw new Error(`Worker returned ${workerResponse.status}`);
      }

      const workerResult = await workerResponse.json();

    } catch (workerError) {
      // Don't fail the request - worker will process eventually
    }

    return NextResponse.json({ 
      message: "Processing started", 
      jobID,
      filesReceived: files.length,
      status: "processing"
    }, { status: 202 });

  } catch (error) {
    return NextResponse.json({ 
      error: "Upload failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}