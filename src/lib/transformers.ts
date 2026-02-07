export async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Generating embedding for:', text.substring(0, 50) + '...');
  return new Array(384).fill(0);
}

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  console.log('Extracting text from image...');
  return 'Placeholder extracted text';
}