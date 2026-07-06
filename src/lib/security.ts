import { NextResponse } from 'next/server';

/**
 * Validates request Origin and Referer headers against Host to guard against CSRF attacks.
 * Designed for mutating operations (POST, PUT, DELETE).
 */
export function verifyCSRF(request: Request): boolean {
  // Allow safe methods
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const host = request.headers.get('host') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';

  // Parse origin hostname
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        console.warn(`[Security CSRF] Origin mismatch: ${originUrl.host} vs expected ${host}`);
        return false;
      }
    } catch {
      return false;
    }
  }

  // Parse referer hostname (fallback)
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        console.warn(`[Security CSRF] Referer mismatch: ${refererUrl.host} vs expected ${host}`);
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}
