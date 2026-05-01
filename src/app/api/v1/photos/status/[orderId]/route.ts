import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { photoOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const [order] = await db
    .select({
      id: photoOrders.id,
      status: photoOrders.status,
      resultImagePath: photoOrders.resultImagePath,
      processingTimeMs: photoOrders.processingTimeMs,
      errorMessage: photoOrders.errorMessage,
      createdAt: photoOrders.createdAt,
      completedAt: photoOrders.completedAt,
    })
    .from(photoOrders)
    .where(eq(photoOrders.id, orderId))
    .limit(1);

  if (!order) {
    return NextResponse.json(
      { code: 404, error: `Order ${orderId} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    code: 200,
    data: {
      orderId: order.id,
      status: order.status,
      previewUrl: order.resultImagePath ?? null,
      processingTimeMs: order.processingTimeMs ?? null,
      errorMessage: order.errorMessage ?? null,
      createdAt: order.createdAt,
      completedAt: order.completedAt ?? null,
    },
  });
}
