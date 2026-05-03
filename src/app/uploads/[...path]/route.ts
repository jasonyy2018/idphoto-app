import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...resolvedParams.path);
    
    console.log(`[Uploads Route] Requested path: ${resolvedParams.path.join('/')}`);
    console.log(`[Uploads Route] Resolved absolute path: ${filePath}`);

    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    console.log(`[Uploads Route] Normalized path: ${normalizedPath}`);
    console.log(`[Uploads Route] Uploads dir: ${uploadsDir}`);

    if (!normalizedPath.startsWith(uploadsDir)) {
      console.log(`[Uploads Route] Forbidden path traversal attempt`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      console.log(`[Uploads Route] File not found at ${filePath}`);
      return new NextResponse('Not found', { status: 404 });
    }

    const file = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.gif') contentType = 'image/gif';

    console.log(`[Uploads Route] Serving file of type ${contentType}, size: ${file.length} bytes`);

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        // Remove aggressive cache to ensure we see fresh files/updates
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Uploads Route] Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
