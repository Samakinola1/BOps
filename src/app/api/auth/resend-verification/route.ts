import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/services/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Basic IP Rate Limiting (limit resend attempts)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const { isRateLimited } = await import('@/lib/rateLimit');
    if (isRateLimited(ip, 3, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many verification requests. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent email enumeration, return a success message even if user doesn't exist
    // or if the user is already verified.
    if (!user || user.emailVerified) {
      return NextResponse.json(
        { message: 'If this email is registered and unverified, a verification link has been sent.' },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Dynamically retrieve request origin/host
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    
    // Trigger email send
    await sendVerificationEmail(normalizedEmail, verificationToken, origin);

    return NextResponse.json(
      { message: 'If this email is registered and unverified, a verification link has been sent.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Resend verification API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during request processing.' },
      { status: 500 }
    );
  }
}
