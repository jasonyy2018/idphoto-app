import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { generateApiKey, getKeyPrefix, hashApiKey } from '@/lib/api-key';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// ─── Admin Auth Guard ─────────────────────────────────────────────────────────

function requireAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('X-Admin-Secret');
  return secret === process.env.ADMIN_SECRET;
}

// ─── GET /api/v1/admin/keys — List all API keys ───────────────────────────────

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ code: 401, error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      isActive: apiKeys.isActive,
      totalCalls: apiKeys.totalCalls,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .orderBy(apiKeys.createdAt);

  return NextResponse.json({ code: 200, data: keys });
}

// ─── POST /api/v1/admin/keys — Create new API key ────────────────────────────

const CreateKeySchema = z.object({ name: z.string().min(1).max(100) });

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ code: 401, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 400, error: 'name is required' },
      { status: 400 }
    );
  }

  const rawKey = generateApiKey();
  const [created] = await db
    .insert(apiKeys)
    .values({
      name: parsed.data.name,
      keyHash: await hashApiKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      isActive: 1,
    })
    .returning();

  // Return the raw key ONCE — it won't be retrievable again
  return NextResponse.json({
    code: 200,
    data: {
      id: created.id,
      name: created.name,
      rawKey, // Only shown on creation
      keyPrefix: created.keyPrefix,
    },
  });
}

// ─── DELETE /api/v1/admin/keys?id=X — Revoke an API key ─────────────────────

export async function DELETE(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ code: 401, error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ code: 400, error: 'id is required' }, { status: 400 });
  }

  await db
    .update(apiKeys)
    .set({ isActive: 0 })
    .where(eq(apiKeys.id, parseInt(id)));

  return NextResponse.json({ code: 200, data: { revoked: true } });
}
