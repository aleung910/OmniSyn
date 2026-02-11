import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    const metadata = await sharp(imageBuffer).metadata();
    
    const enhanced = await sharp(imageBuffer)
      .resize(3000, null, { 
        withoutEnlargement: false,  // Upscale small images
        kernel: sharp.kernel.lanczos3  // High-quality resampling
      })
      .grayscale()
      .normalize()
      .sharpen({
        sigma: 1.5,
        m1: 1.0,
        m2: 0.5
      })
      .linear(1.2, -(128 * 1.2) + 128)
      .png()
      .toBuffer();
    
    const enhancedMetadata = await sharp(enhanced).metadata();
    
    const result = await Tesseract.recognize(enhanced, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📖 OCR: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const text = result.data.text.trim();
    const confidence = result.data.confidence;
    
    console.log(`Extracted ${text.length} characters (confidence: ${confidence.toFixed(1)}%)`);
    
    return text || 'No text detected';
    
  } catch (error) {
    console.error('OCR Error:', error);
    return 'OCR failed';
  }
}