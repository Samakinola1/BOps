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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!quotation || quotation.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    return NextResponse.json({ quotation }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch quotation detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching quotation details.' },
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
    const { customerId, issueDate, expiryDate, status, items, notes } = body;

    if (!customerId || !issueDate || !expiryDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer, dates, and at least one line item are required.' }, { status: 400 });
    }

    // Verify ownership
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation || existingQuotation.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    // Calculate totals
    let calculatedTaxAmount = 0;
    let calculatedDiscountAmount = 0;
    let calculatedTotal = 0;

    const parsedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const itemTaxRate = parseFloat(item.taxRate) || 0;
      const itemDiscountRate = parseFloat(item.discountRate) || 0;

      const subtotal = quantity * unitPrice;
      const discount = subtotal * (itemDiscountRate / 100);
      const tax = (subtotal - discount) * (itemTaxRate / 100);
      const totalAmount = subtotal - discount + tax;

      calculatedTaxAmount += tax;
      calculatedDiscountAmount += discount;
      calculatedTotal += totalAmount;

      return {
        description: item.description || 'Line Item',
        quantity,
        unitPrice,
        taxRate: itemTaxRate,
        discountRate: itemDiscountRate,
        totalAmount,
        productId: item.productId || null,
      };
    });

    // Execute update inside a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      // 1. Delete all old items
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // 2. Update quotation parent and insert new items
      return tx.quotation.update({
        where: { id },
        data: {
          customerId,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
          status: status || existingQuotation.status,
          taxAmount: calculatedTaxAmount,
          discountAmount: calculatedDiscountAmount,
          totalAmount: calculatedTotal,
          notes: notes || null,
          items: {
            create: parsedItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });
    });

    return NextResponse.json({
      message: 'Quotation updated successfully.',
      quotation,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update quotation API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating quotation.' },
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

    // Verify ownership
    const quotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation || quotation.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    await prisma.quotation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Quotation deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete quotation API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred deleting quotation.' },
      { status: 500 }
    );
  }
}
