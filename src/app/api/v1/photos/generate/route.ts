import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { photoOrders, specTemplates } from '@/lib/db/schema';
import { processIdPhoto } from '@/lib/photo-processor';
import { saveOriginal } from '@/lib/storage';
import { eq } from 'drizzle-orm';

import { generateIdPhotoCore } from '@/lib/services/photo-service';

// ─── Request Schema ───────────────────────────────────────────────────────────

const RequestSchema = z.object({
  templateId: z.number().int().positive(),
  imageBase64: z
    .string()
    .min(100)
    .refine(
      (s) => s.startsWith('data:image/'),
      'imageBase64 must include data URI prefix (data:image/...;base64,...)'
    ),
});

// ─── POST /api/v1/photos/generate ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, parsed.error.issues[0]?.message ?? 'Invalid request');
  }

  const { templateId, imageBase64 } = parsed.data;
  const apiKeyId = request.headers.get('x-api-key-id');

  try {
    const data = await generateIdPhotoCore(
      templateId, 
      imageBase64, 
      apiKeyId ? parseInt(apiKeyId) : null
    );
    return NextResponse.json({ code: 200, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('rate_limit') || message.includes('429')) {
      return error(429, 'OpenAI rate limit reached, please try again later');
    }
    return error(500, `Processing failed: ${message}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function error(code: number, message: string) {
  return NextResponse.json({ code, error: message }, { status: code });
}

