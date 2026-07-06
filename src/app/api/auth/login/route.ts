import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Basic IP Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const { isRateLimited } = await import('@/lib/rateLimit');
    if (isRateLimited(ip, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        business: true,
        businessUser: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email address before logging in.' },
        { status: 403 }
      );
    }

    // Record login activity
    if (user.businessId) {
      const { logActivity } = await import('@/lib/services/activity');
      await logActivity(user.id, user.businessId, 'Login', { email: user.email });
    }

    // Auto-seed BusinessUser if it doesn't exist yet for backward compatibility
    if (user.businessId && !user.businessUser) {
      try {
        const newBusUser = await prisma.businessUser.create({
          data: {
            businessId: user.businessId,
            userId: user.id,
            roleName: 'Owner',
          },
          include: {
            role: true,
          },
        });
        user.businessUser = newBusUser;
      } catch (err) {
        console.error('Failed to auto-seed BusinessUser for owner on login:', err);
      }
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    // Set HTTP-only Cookie
    const response = NextResponse.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        businessUser: user.businessUser,
      },
      business: user.business ? {
        id: user.business.id,
        name: user.business.name,
        currency: user.business.currency,
      } : null,
    });

    // Secure cookie setup
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.append(
      'Set-Cookie',
      `auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${isProd ? '; Secure' : ''}`
    );

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during login.' },
      { status: 500 }
    );
  }
}
