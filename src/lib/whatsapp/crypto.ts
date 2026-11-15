import crypto from 'crypto';

/**
 * Validates the HMAC SHA-256 signature from Meta Graph API webhook request.
 * Header format: sha256=<signature_hex>
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) {
    // If no app secret is configured (e.g. in local development / testing), pass
    return !appSecret;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const receivedSig = parts[1];

  try {
    const expectedSig = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSig, 'utf8');
    const receivedBuffer = Buffer.from(receivedSig, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error('Meta signature verification error:', err);
    return false;
  }
}

