import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Checking permission to view activity logs (gated to team managers)
    if (user.businessUser?.roleName !== 'Owner' && user.businessUser?.roleName !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view audit logs.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Filter by businessId and search query if provided
    const whereClause: any = {
      businessId: user.businessId,
    };

    if (search) {
      whereClause.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where: whereClause }),
    ]);

    const mappedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details ? JSON.parse(log.details) : null,
      createdAt: log.createdAt,
      userName: log.user?.name || 'System / Auto',
      userEmail: log.user?.email || 'N/A',
    }));

    return NextResponse.json({
      logs: mappedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch activity logs API error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching audit trail logs.' },
      { status: 500 }
    );
  }
}
