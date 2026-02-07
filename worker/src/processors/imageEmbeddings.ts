import { pipeline } from '@xenova/transformers';

let imageExtractor: any = null;

async function getImageExtractor() {
  if (!imageExtractor) {
    imageExtractor = await pipeline(
      'image-feature-extraction',
      'Xenova/clip-vit-base-patch32'
    );
  }
  return imageExtractor;
}

export async function generateImageEmbedding(base64Image: string): Promise<number[]> {
  try {
    
    const model = await getImageExtractor();
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Generate embedding (CLIP creates 512-dimensional vector)
    const output = await model(imageBuffer);
    
    // Convert tensor to array
    const embedding = Array.from(output.data) as number[];
    
    console.log(`✅ Generated ${embedding.length}-dimensional image embedding`);
    
    return embedding;
    
  } catch (error) {
    throw new Error(`Image embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}