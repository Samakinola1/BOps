import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!expense || expense.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Expense record not found.' }, { status: 404 });
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch expense detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching expense details.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, vendor, categoryId, date, receiptUrl, notes } = body;

    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense || existingExpense.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Expense record not found.' }, { status: 404 });
    }

    const updateData: any = {};

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'A valid expense amount greater than zero is required.' }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }

    if (vendor !== undefined) {
      if (!vendor || vendor.trim() === '') {
        return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 });
      }
      updateData.vendor = vendor.trim();
    }

    if (categoryId !== undefined) {
      if (!categoryId) {
        return NextResponse.json({ error: 'Category is required.' }, { status: 400 });
      }
      
      // Verify category ownership
      const category = await prisma.expenseCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.businessId !== user.businessId) {
        return NextResponse.json({ error: 'Selected category was not found.' }, { status: 400 });
      }
      updateData.categoryId = categoryId;
    }

    if (date !== undefined) {
      if (!date) {
        return NextResponse.json({ error: 'Expense date is required.' }, { status: 400 });
      }
      updateData.date = new Date(date);
    }

    if (receiptUrl !== undefined) {
      updateData.receiptUrl = receiptUrl || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      message: 'Expense record updated successfully.',
      expense,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update expense API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating expense details.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense || expense.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Expense record not found.' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Expense record deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete expense API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred deleting expense.' },
      { status: 500 }
    );
  }
}
