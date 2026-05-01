import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { hashApiKey } from '@/lib/api-key';
import { eq } from 'drizzle-orm';

// ─── Public routes that do NOT require an API key ─────────────────────────────
const PUBLIC_PATHS = [
  '/',
  '/upload',
  '/result',
  '/admin',
  '/api/v1/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public/frontend routes and static assets
  if (
    !pathname.startsWith('/api/v1/') ||
    pathname === '/api/v1/health' ||
    pathname.startsWith('/api/v1/admin') // Admin routes use ADMIN_SECRET header
  ) {
    return NextResponse.next();
  }

  // ── Validate X-API-Key ─────────────────────────────────────────────────
  const rawKey = request.headers.get('X-API-Key');
  if (!rawKey) {
    return NextResponse.json(
      { code: 401, error: 'Missing X-API-Key header' },
      { status: 401 }
    );
  }

  const keyHash = await hashApiKey(rawKey);

  try {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!key || key.isActive !== 1) {
      return NextResponse.json(
        { code: 401, error: 'Invalid or revoked API key' },
        { status: 401 }
      );
    }

    // Attach key id to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-api-key-id', String(key.id));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { code: 500, error: 'Authentication service unavailable' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
