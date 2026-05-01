import { db } from '@/lib/db';
import { photoOrders, specTemplates } from '@/lib/db/schema';
import { processIdPhoto } from '@/lib/photo-processor';
import { saveOriginal } from '@/lib/storage';
import { eq } from 'drizzle-orm';

export async function generateIdPhotoCore(
  templateId: number,
  imageBase64: string,
  apiKeyId?: number | null
) {
  // ── Fetch template ───────────────────────────────────────────────────
  const [template] = await db
    .select()
    .from(specTemplates)
    .where(eq(specTemplates.id, templateId))
    .limit(1);

  if (!template) {
    throw new Error(`Template with id=${templateId} not found`);
  }

  // ── Decode and save original image ───────────────────────────────────
  let originalBuffer: Buffer;
  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    if (!base64Data) throw new Error('Missing base64 data');
    originalBuffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new Error('Failed to decode imageBase64');
  }

  const originalImagePath = await saveOriginal(originalBuffer);

  // ── Create order record (status: processing) ─────────────────────────
  const [order] = await db
    .insert(photoOrders)
    .values({
      templateId,
      apiKeyId: apiKeyId ?? null,
      originalImagePath,
      status: 'processing',
    })
    .returning();

  // ── Process with OpenAI gpt-image-2 ─────────────────────────────────
  try {
    const result = await processIdPhoto(originalBuffer, template);

    // ── Update order with success ──────────────────────────────────────
    await db
      .update(photoOrders)
      .set({
        resultImagePath: result.resultPublicPath,
        openaiPrompt: result.promptUsed,
        status: 'completed',
        processingTimeMs: result.processingTimeMs,
        completedAt: new Date(),
      })
      .where(eq(photoOrders.id, order.id));

    // ── Increment API key call counter ─────────────────────────────────
    if (apiKeyId) {
      const { apiKeys } = await import('@/lib/db/schema');
      const { sql } = await import('drizzle-orm');
      await db
        .update(apiKeys)
        .set({
          totalCalls: sql`${apiKeys.totalCalls} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(apiKeys.id, apiKeyId));
    }

    return {
      orderId: order.id,
      previewUrl: result.resultPublicPath,
      status: 'completed',
      processingTimeMs: result.processingTimeMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Mark order as failed
    await db
      .update(photoOrders)
      .set({ status: 'failed', errorMessage: message })
      .where(eq(photoOrders.id, order.id));

    console.error('[generate] Processing failed:', message);
    throw err;
  }
}
