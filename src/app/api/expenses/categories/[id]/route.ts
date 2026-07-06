import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
    const { name, disabled } = body;

    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category || category.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Category name cannot be empty.' }, { status: 400 });
      }
      const trimmedName = name.trim();
      
      // Ensure unique name
      const existing = await prisma.expenseCategory.findFirst({
        where: {
          businessId: user.businessId,
          name: { equals: trimmedName },
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
      }
      updateData.name = trimmedName;
    }

    if (disabled !== undefined) {
      updateData.disabled = !!disabled;
    }

    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Category updated successfully.',
      category: updatedCategory,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update category API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating category.' },
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

    const category = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!category || category.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Check if any expenses are using this category
    const linkedExpensesCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (linkedExpensesCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete category because it has active linked expenses. Disable the category instead to hide it.',
      }, { status: 409 });
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Category deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete category API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred deleting category.' },
      { status: 500 }
    );
  }
}
