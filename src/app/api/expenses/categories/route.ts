import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (activeOnly) {
      whereCondition.disabled = false;
    }

    const categories = await prisma.expenseCategory.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch categories API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching categories.' },
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

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if category name already exists for this business
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        businessId: user.businessId,
        name: { equals: trimmedName },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: trimmedName,
        businessId: user.businessId,
      },
    });

    return NextResponse.json({
      message: 'Category created successfully.',
      category,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create category API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating category.' },
      { status: 500 }
    );
  }
}
