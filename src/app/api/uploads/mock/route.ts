import { NextRequest, NextResponse } from 'next/server';

// In-memory mock storage map for dev environment preview
const devMockStorage = new Map<string, { buffer: Uint8Array; contentType: string }>();

export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || 'mock-file';
  const contentType = req.headers.get('content-type') || 'application/octet-stream';

  const buffer = new Uint8Array(await req.arrayBuffer());
  devMockStorage.set(key, { buffer, contentType });

  console.log(`📦 [Dev Mock Upload] Stored mock file for key "${key}" (${buffer.byteLength} bytes)`);

  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || 'mock-file';

  const stored = devMockStorage.get(key);
  if (!stored) {
    // Return a 1x1 placeholder transparent PNG
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    return new NextResponse(transparentPixel, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  }

  return new Response(Buffer.from(stored.buffer), {
    status: 200,
    headers: {
      'Content-Type': stored.contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
