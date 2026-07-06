import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        emailVerified: false,
      },
      include: {
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired invitation token.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      businessName: user.business?.name || 'Ops Suite',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Verify invite token API error:', error);
    return NextResponse.json(
      { valid: false, error: 'An error occurred verifying the invitation token.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, name } = body;

    if (!token || !password || !name) {
      return NextResponse.json({ error: 'Token, name, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        emailVerified: false,
      },
      include: {
        business: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired invitation token.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        passwordHash: hashedPassword,
        emailVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json({
      message: 'Invitation accepted successfully. You can now log in to your account.',
      businessName: user.business?.name || 'Ops Suite',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Accept invite API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred accepting the invitation.' },
      { status: 500 }
    );
  }
}
