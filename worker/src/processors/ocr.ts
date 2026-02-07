import Tesseract from 'tesseract.js';

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`📖 OCR: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const text = result.data.text.trim();
    
    return text || 'No text detected';
    
  } catch (error) {
    return 'OCR failed';
  }
}