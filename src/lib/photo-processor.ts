import sharp from 'sharp';
import OpenAI from 'openai';
import { buildPhotoPrompt } from './prompt-builder';
import { saveResult } from './storage';
import type { SpecTemplate } from './db/schema';

// ─── OpenAI Client ────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  // ── Step 1: Call OpenAI gpt-image-2 ─────────────────────────────────────
  const imageFile = await toOpenAIFile(originalBuffer, 'original.jpg');

  const response = await openai.images.edit({
    model: 'gpt-image-2',
    image: imageFile,
    prompt,
    size: '1024x1024',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI returned no image data');
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

/**
 * Convert a Buffer to an OpenAI-compatible File object for the images.edit API.
 */
async function toOpenAIFile(buffer: Buffer, filename: string): Promise<File> {
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  return new File([arrayBuffer], filename, { type: 'image/jpeg' });
}

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
