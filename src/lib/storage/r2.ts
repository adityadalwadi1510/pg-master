import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createAdminClient } from '@/lib/supabase/admin';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pg-master-media';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME
);

const STORAGE_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'pg-master-media';

// Create S3Client for Cloudflare R2 (S3-compatible)
function getR2Client(): S3Client | null {
  if (!isR2Configured) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  isMock: boolean;
  provider: 'r2' | 'supabase' | 'mock';
}

/**
 * Generates a presigned PUT URL for direct client-to-storage upload (FR-2.2 & FR-4.2)
 * Eliminates server egress and compute overhead.
 * Priority:
 * 1. Cloudflare R2 (if configured in .env.local)
 * 2. Supabase Storage (zero credit-card, 1 GB free tier on existing project)
 * 3. Local Mock fallback (dev mode without cloud credentials)
 */
export async function createPresignedUploadUrl(params: {
  fileName: string;
  fileType: string;
  category: 'kyc' | 'complaints';
}): Promise<PresignedUrlResult> {
  const timestamp = Date.now();
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${params.category}/${timestamp}-${sanitizedFileName}`;

  // 1. Cloudflare R2 (if configured)
  if (isR2Configured) {
    const s3 = getR2Client()!;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: params.fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = R2_PUBLIC_DOMAIN
      ? `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
      isMock: false,
      provider: 'r2',
    };
  }

  // 2. Supabase Storage (zero-cost, no credit card required)
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .createSignedUploadUrl(key);

    if (!error && data?.signedUrl) {
      const { data: pubData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(key);

      return {
        uploadUrl: data.signedUrl,
        fileUrl: pubData.publicUrl,
        key,
        isMock: false,
        provider: 'supabase',
      };
    }
    if (error) {
      console.warn('Supabase signed upload URL generation error:', error.message);
    }
  } catch (err: any) {
    console.warn('Could not initialize Supabase storage client:', err.message);
  }

  // 3. Dev Mock fallback
  const mockFileUrl = `/api/uploads/mock?key=${encodeURIComponent(key)}`;
  return {
    uploadUrl: `/api/uploads/mock?key=${encodeURIComponent(key)}`,
    fileUrl: mockFileUrl,
    key,
    isMock: true,
    provider: 'mock',
  };
}
