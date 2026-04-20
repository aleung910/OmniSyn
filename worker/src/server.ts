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
  res.json({ status: 'Worker is running' });
});

app.post('/process', async (req, res) => {
  try {
    const { jobID, files } = req.body;
        
    if (!jobID || !files || files.length === 0) {
      return res.status(400).json({ error: 'Missing jobID or files' });
    }

    res.json({ 
      success: true,
      jobID,
      filesProcessed: files.length 
    });

    for (const file of files) {
      console.log(`\nProcessing: ${file.name}`);
      
      try {
        console.log('🔍 Step 1: Running OCR...');
        const extractedText = await extractTextFromImage(file.data);
        console.log(` Extracted: "${extractedText.substring(0, 100)}..."`);
      
        const noteToUpdate = await prisma.note.findFirst({
          where: { jobId: jobID, fileName: file.name, status: 'processing' },
        });

        if (!noteToUpdate) {
          console.warn(` No pending note found for ${file.name}, skipping.`);
          continue;
        }
        
        if(extractedText.length > 20){
          console.log('📝 Step 2: Generating text embedding (384-dim)...');
          const embedding = await generateTextEmbedding(extractedText);
          const vectorString = `[${embedding.join(',')}]`;
            await prisma.$executeRaw`
                      UPDATE "Note"
                      SET
                        "textContent"   = ${extractedText},
                        "textEmbedding" = ${vectorString}::vector,
                        status          = 'completed'
                      WHERE id = ${noteToUpdate.id}
                    `;
           console.log(`✅ ${file.name} — text embedding stored (384-dim)`);
        }
        else{
          console.log('🖼️  Step 2: Generating image embedding (512-dim)...');
          const embedding = await generateImageEmbedding(file.data);
          const vectorString = `[${embedding.join(',')}]`;
          await prisma.$executeRaw`
            UPDATE "Note"
            SET
              "textContent"    = ${extractedText},
              "imageEmbedding" = ${vectorString}::vector,
              status           = 'completed'
            WHERE id = ${noteToUpdate.id}
          `;
          console.log(`✅ ${file.name} — image embedding stored (512-dim)`);
        }
      }
      catch(fileError){
        console.error(`   Error processing ${file.name}:`, fileError);
        const failedNote = await prisma.note.findFirst({
              where: { jobId: jobID, fileName: file.name, status: 'processing' },
            });

        if (failedNote) {
          await prisma.note.update({
            where: { id: failedNote.id },
            data: {
              status: 'failed',
              textContent: `Error: ${fileError instanceof Error ? fileError.message : 'Processing failed'}`,
            },
          });
        }
      }
    }
    console.log(`\n✅ Job ${jobID} complete`);
 } catch (error) {
    console.error('Worker error:', error);
  }
});

app.post('/embed', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const { generateTextEmbedding } = await import('./processors/textEmbeddings.js');
    const embedding = await generateTextEmbedding(text);
        
    res.json({ embedding });
    
  } catch (error) {
    res.status(500).json({
      error: 'Embedding generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
    console.log(` Worker running on port ${PORT}`);
});