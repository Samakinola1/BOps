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
    const categoryId = searchParams.get('categoryId') || '';
    const search = searchParams.get('search') || '';

    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    if (search) {
      whereCondition.OR = [
        { vendor: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereCondition,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch expenses API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching expenses.' },
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
    const { amount, vendor, categoryId, date, receiptUrl, notes } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'A valid expense amount greater than zero is required.' }, { status: 400 });
    }

    if (!vendor || vendor.trim() === '') {
      return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Expense date is required.' }, { status: 400 });
    }

    // Verify category ownership
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Selected category was not found.' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parsedAmount,
        vendor: vendor.trim(),
        categoryId,
        date: new Date(date),
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        businessId: user.businessId!,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: 'Expense added successfully.',
      expense,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create expense API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred adding expense.' },
      { status: 500 }
    );
  }
}
