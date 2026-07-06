import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to avoid email enumeration
      return NextResponse.json(
        { message: 'If this email is registered, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    await sendPasswordResetEmail(email, resetToken, origin);

    return NextResponse.json(
      { message: 'If this email is registered, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing forgot password.' },
      { status: 500 }
    );
  }
}
