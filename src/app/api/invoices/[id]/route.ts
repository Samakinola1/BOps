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

    let invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice || invoice.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // On-the-fly check to transition to Overdue
    if (
      ['Sent', 'Partially Paid'].includes(invoice.status) &&
      new Date(invoice.dueDate) < new Date()
    ) {
      invoice = await prisma.invoice.update({
        where: { id },
        data: { status: 'Overdue' },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      });
    }

    // Calculate dynamic totals for outstanding balance
    const totalPaid = invoice.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const outstandingBalance = invoice.totalAmount - totalPaid;

    return NextResponse.json({
      invoice: {
        ...invoice,
        totalPaid,
        outstandingBalance: outstandingBalance < 0 ? 0 : outstandingBalance,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch invoice detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching invoice details.' },
      { status: 500 }
    );
  }
}

import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']).optional(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    description: z.string().optional().default('Line Item'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    unitPrice: z.number().nonnegative('Unit price must be non-negative'),
    taxRate: z.number().optional().default(0),
    discountRate: z.number().optional().default(0),
    productId: z.string().optional().nullable(),
  })).min(1, 'At least one line item is required'),
});

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

    // Validate request body
    const parseResult = invoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { customerId, issueDate, dueDate, status, items, notes } = parseResult.data;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice || existingInvoice.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // Calculate totals
    let calculatedTaxAmount = 0;
    let calculatedDiscountAmount = 0;
    let calculatedTotal = 0;

    const parsedItems = items.map((item: any) => {
      const subtotal = item.quantity * item.unitPrice;
      const discount = subtotal * (item.discountRate / 100);
      const tax = (subtotal - discount) * (item.taxRate / 100);
      const totalAmount = subtotal - discount + tax;

      calculatedTaxAmount += tax;
      calculatedDiscountAmount += discount;
      calculatedTotal += totalAmount;

      return {
        description: item.description || 'Line Item',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discountRate: item.discountRate,
        totalAmount,
        productId: item.productId || null,
      };
    });

    // Update Invoice inside a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Delete all old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // 2. Update Invoice parent and insert new items
      return tx.invoice.update({
        where: { id },
        data: {
          customerId,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          status: status || existingInvoice.status,
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
          payments: true,
        },
      });
    });

    // Calculate balance
    const totalPaid = invoice.payments.reduce((sum, pay) => sum + pay.amount, 0);
    const outstandingBalance = invoice.totalAmount - totalPaid;

    // Record activity
    await logActivity(user.id, user.businessId, 'Invoice Updated', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
    });

    return NextResponse.json({
      message: 'Invoice updated successfully.',
      invoice: {
        ...invoice,
        totalPaid,
        outstandingBalance: outstandingBalance < 0 ? 0 : outstandingBalance,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update invoice API error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating invoice.' },
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Invoice Deleted', {
      id,
      invoiceNumber: invoice.invoiceNumber,
    });

    return NextResponse.json({
      message: 'Invoice deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete invoice API error:', error);
    return NextResponse.json(
      { error: 'An error occurred deleting invoice.' },
      { status: 500 }
    );
  }
}
