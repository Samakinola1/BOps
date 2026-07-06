import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    // Basic IP Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const { isRateLimited } = await import('@/lib/rateLimit');
    if (isRateLimited(ip, 5, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const { name, email, password, companyName } = await request.json();

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Email, password, and company name are required.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create Business and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: companyName,
          currency: 'USD',
          invoicePrefix: 'INV-',
          invoicePadding: 4,
          nextInvoiceNumber: 1,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          businessId: business.id,
          verificationToken,
          emailVerified: false,
        },
      });

      // Create owner user association
      await tx.businessUser.create({
        data: {
          businessId: business.id,
          userId: user.id,
          roleName: 'Owner',
        },
      });

      return { user, business };
    });

    // Send mock verification email
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    await sendVerificationEmail(email, verificationToken, origin);

    return NextResponse.json(
      {
        message: 'Registration successful. A verification email has been sent.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        business: {
          id: result.business.id,
          name: result.business.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration.' },
      { status: 500 }
    );
  }
}
