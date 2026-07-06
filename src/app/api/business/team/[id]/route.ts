import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!hasPermission(user, 'manage:team')) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to modify team members.' }, { status: 403 });
    }

    const { id } = await params;

    const member = await prisma.businessUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!member || member.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    // Prevent Owner from deleting themselves
    if (member.userId === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the business team list.' }, { status: 400 });
    }

    // Prevent removing the main Owner of the company unless you are the Owner yourself, and it is a different owner (if multiple owners are supported. But user specifies "one owner per business"!)
    if (member.roleName === 'Owner') {
      return NextResponse.json({ error: 'The business Owner account cannot be removed.' }, { status: 400 });
    }

    // Delete the user record. This Cascade deletes the BusinessUser record due to relations onDelete: Cascade.
    await prisma.user.delete({
      where: { id: member.userId },
    });

    return NextResponse.json({ message: 'Team member removed successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete team member API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred removing team member.' },
      { status: 500 }
    );
  }
}
