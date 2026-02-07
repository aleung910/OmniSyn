import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateImageEmbedding } from './processors/imageEmbeddings.js'
import { extractTextFromImage } from './processors/ocr.js';
import { generateTextEmbedding } from './processors/textEmbeddings.js';

dotenv.config();

const app = express();  
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'Worker is running! 🚀' });
});

app.post('/process', async (req, res) => {
  try {
    const { jobID, files } = req.body;
    
    console.log(`\n Received job ${jobID} with ${files.length} file(s)`);
    
    if (!jobID || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing jobID or files' });
    }

    for (const file of files) {      
      try {
        // Extract text from image (OCR)
        const extractedText = await extractTextFromImage(file.data);
        
        // Create embedding based on what we found
        let embedding: number[];
        
        if (extractedText.length > 20) {
          embedding = await generateTextEmbedding(extractedText);
        } else {
          embedding = await generateImageEmbedding(file.data);
        }
        
        await prisma.note.updateMany({
          where: {
            jobId: jobID,
            fileName: file.name
          },
          data: {
            textContent: extractedText,
            embedding: embedding,
            status: 'completed'
          }
        });
                
      } catch (fileError) {
        
        await prisma.note.updateMany({
          where: {
            jobId: jobID,
            fileName: file.name
          },
          data: {
            status: 'failed',
            textContent: `Error: ${fileError instanceof Error ? fileError.message : 'Processing failed'}`
          }
        });
      }
    }
    
    console.log(`\n Job ${jobID} complete`);
    
    res.json({ 
      success: true,
      jobID,
      filesProcessed: files.length 
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🔧 Worker running on http://localhost:${PORT}`);
  console.log(`🧠 AI models will load on first request`);
});