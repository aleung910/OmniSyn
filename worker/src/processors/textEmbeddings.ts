import { pipeline } from '@xenova/transformers';

let textExtractor: any = null;

async function getTextExtractor() {
  if (!textExtractor) {
    console.log('📝 Loading text embedding model...');
    textExtractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Text embedding model loaded!');
  }
  return textExtractor;
}

export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const model = await getTextExtractor();
    
    // Generate embedding with pooling and normalization
    const output = await model(text, { pooling: 'mean', normalize: true });
    
    // Convert to array
    const embedding = Array.from(output.data) as number[];
        
    return embedding;
  } catch (error) {
    throw new Error(`Text embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}