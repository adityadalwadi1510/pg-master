import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUploadUrl } from '@/lib/storage/r2';
import { z } from 'zod';

const presignSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  category: z.enum(['kyc', 'complaints']),
});

/**
 * Generates presigned PUT URL for direct client-to-R2 upload (FR-2.2 & FR-4.2)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = presignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { fileName, fileType, category } = parsed.data;

    const result = await createPresignedUploadUrl({
      fileName,
      fileType,
      category,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Presign generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', message: err.message },
      { status: 500 }
    );
  }
}

