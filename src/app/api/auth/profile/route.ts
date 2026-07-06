import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await request.json();

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password.' },
          { status: 400 }
        );
      }

      // Fetch user with passwordHash
      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      const match = await comparePassword(currentPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({
      message: 'Profile updated successfully.',
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating profile.' },
      { status: 500 }
    );
  }
}
