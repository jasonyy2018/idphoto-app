'use server';

import { generateIdPhotoCore } from '@/lib/services/photo-service';

export async function submitPhoto(templateId: number, base64: string) {
  try {
    const result = await generateIdPhotoCore(templateId, base64, null);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
