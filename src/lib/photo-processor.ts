import sharp from 'sharp';
import OpenAI, { toFile } from 'openai';
import { buildPhotoPrompt } from './prompt-builder';
import { saveResult } from './storage';
import type { SpecTemplate } from './db/schema';

// ─── OpenAI Client ────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
  defaultHeaders: {
    ...(process.env.NEXT_PUBLIC_APP_URL && { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL }),
    'X-OpenRouter-Title': 'PhotoID AI',
  }
});

// ─── Pixel Calculator ─────────────────────────────────────────────────────────

/**
 * Convert millimeters to pixels at the given DPI.
 * Formula: px = mm × dpi ÷ 25.4
 */
function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / 25.4);
}

// ─── Main Processor ───────────────────────────────────────────────────────────

export interface ProcessResult {
  resultPublicPath: string;
  promptUsed: string;
  processingTimeMs: number;
}

/**
 * Core pipeline:
 * 1. Build prompt from template
 * 2. Call gpt-image-2 images.edit with the original image
 * 3. Decode base64 response
 * 4. Resize/crop to exact pixel dimensions with Sharp
 * 5. Save result to disk
 */
export async function processIdPhoto(
  originalBuffer: Buffer,
  template: SpecTemplate
): Promise<ProcessResult> {
  const startTime = Date.now();
  const prompt = buildPhotoPrompt(template);
  // ── Step 1: Compress image before sending as JSON to avoid WAF limits ──
  // Doubao 2K requires higher resolution, so we compress to max 2048x2048
  const compressedBuffer = await sharp(originalBuffer)
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  const base64Image = compressedBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;
  const modelName = process.env.OPENAI_MODEL || 'openai/gpt-5.4-image-2';
  let b64 = '';

  if (modelName.includes('doubao')) {
    // ── Call Volcengine Doubao via images.generate ───────────────
    const response = await openai.images.generate({
      model: modelName,
      prompt: prompt,
      n: 1,
      size: '2K' as any, // Doubao specifically uses strings like '2K'
      response_format: 'b64_json',
      // @ts-ignore - Volcengine specific extensions
      extra_body: {
        image: base64Image, // passing base64 directly as expected by many image-to-image endpoints
        watermark: false
      }
    });

    if (!response.data?.[0]?.b64_json) {
      throw new Error('Doubao API returned no image data');
    }
    b64 = response.data[0].b64_json;

  } else if (modelName === 'gpt-image-2') {
    // ── Call OneAPI / gpt-image-2 via images.edit ───────────────
    const imageFile = await toFile(compressedBuffer, 'image.jpg', { type: 'image/jpeg' });
    
    const response = await openai.images.edit({
      model: modelName,
      prompt: prompt,
      image: imageFile,
      n: 1,
      response_format: 'b64_json'
    });

    if (!response.data?.[0]?.b64_json) {
      throw new Error(`${modelName} API returned no image data`);
    }
    b64 = response.data[0].b64_json;

  } else {
    // ── Call OpenRouter via Chat Completions ─────────────────────
    const apiResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      // @ts-ignore - OpenRouter specific extension
      modalities: ['image', 'text']
    });

    const message = apiResponse.choices[0]?.message as any;
    if (message?.images && message.images.length > 0) {
      const imageUrl = message.images[0].image_url.url;
      b64 = imageUrl.includes(',') ? imageUrl.split(',')[1] : imageUrl;
    } else {
      throw new Error('OpenRouter API returned no image data in message.images');
    }
  }

  // ── Step 2: Decode base64 ─────────────────────────────────────────────
  const rawBuffer = Buffer.from(b64, 'base64');

  // ── Step 3: Sharp resize to exact spec dimensions ─────────────────────
  const targetW = mmToPx(template.widthMm, template.dpi);
  const targetH = mmToPx(template.heightMm, template.dpi);

  const processedBuffer = await sharp(rawBuffer)
    .resize(targetW, targetH, {
      fit: 'cover',
      position: 'top',
    })
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer();

  // ── Step 4: Save to disk ──────────────────────────────────────────────
  const resultPublicPath = await saveResult(processedBuffer);

  return {
    resultPublicPath,
    promptUsed: prompt,
    processingTimeMs: Date.now() - startTime,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Use JPG, PNG, or WEBP.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }
  return { valid: true };
}
