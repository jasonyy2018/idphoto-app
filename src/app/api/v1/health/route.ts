import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Ping the database
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({
      code: 200,
      data: {
        status: 'ok',
        service: 'PhotoID AI',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    });
  } catch {
    return NextResponse.json(
      {
        code: 503,
        data: {
          status: 'degraded',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
