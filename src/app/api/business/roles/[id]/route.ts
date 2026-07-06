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
      return NextResponse.json({ error: 'Forbidden. You do not have permission to delete roles.' }, { status: 403 });
    }

    const { id } = await params;

    const role = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!role || role.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }

    // Check if any team members are currently assigned this custom role
    const assignedUser = await prisma.businessUser.findFirst({
      where: { roleId: id },
    });

    if (assignedUser) {
      return NextResponse.json({
        error: 'This role cannot be deleted because it is currently assigned to one or more active team members. Please reassign the members first.'
      }, { status: 400 });
    }

    await prisma.customRole.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Custom role deleted successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete custom role API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred deleting custom role.' },
      { status: 500 }
    );
  }
}
