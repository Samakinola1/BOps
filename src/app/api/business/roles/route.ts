import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!hasPermission(user, 'manage:team')) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view roles.' }, { status: 403 });
    }

    const roles = await prisma.customRole.findMany({
      where: { businessId: user.businessId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ roles }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch custom roles API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching custom roles.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!hasPermission(user, 'manage:team')) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to manage roles.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, permissions } = body;

    if (!name || !permissions) {
      return NextResponse.json({ error: 'Role name and permissions list are required.' }, { status: 400 });
    }

    const normalizedName = name.trim();
    if (['Owner', 'Admin', 'Manager', 'Staff'].includes(normalizedName)) {
      return NextResponse.json({ error: 'Role name conflicts with a built-in default role.' }, { status: 400 });
    }

    // Check unique name for this business
    const existing = await prisma.customRole.findFirst({
      where: {
        businessId: user.businessId,
        name: { equals: normalizedName },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A custom role with this name already exists.' }, { status: 409 });
    }

    const newRole = await prisma.customRole.create({
      data: {
        name: normalizedName,
        permissions: permissions.trim(),
        businessId: user.businessId,
      },
    });

    return NextResponse.json({
      message: 'Custom role created successfully.',
      role: newRole,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create custom role API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating custom role.' },
      { status: 500 }
    );
  }
}
