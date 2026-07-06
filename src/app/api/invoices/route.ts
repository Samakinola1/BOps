import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Helper function to check and update overdue statuses dynamically
async function handleOverdueInvoices(businessId: string) {
  try {
    // Find all invoices that are Sent or Partially Paid and past their due date
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        businessId,
        status: { in: ['Sent', 'Partially Paid'] },
        dueDate: { lt: new Date() },
      },
      select: { id: true },
    });

    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: { in: overdueInvoices.map((inv) => inv.id) },
        },
        data: { status: 'Overdue' },
      });
    }
  } catch (error) {
    console.error('Error updating overdue statuses on-the-fly:', error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Perform on-the-fly overdue status calculation before listing
    await handleOverdueInvoices(user.businessId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (status) {
      whereCondition.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereCondition,
      include: {
        customer: {
          select: { name: true, businessName: true },
        },
        items: true,
        payments: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    // Calculate outstanding balance for each invoice dynamically in JSON response
    const invoicesWithBalances = invoices.map((inv) => {
      const totalPaid = inv.payments.reduce((sum, pay) => sum + pay.amount, 0);
      const outstandingBalance = inv.totalAmount - totalPaid;
      return {
        ...inv,
        totalPaid,
        outstandingBalance: outstandingBalance < 0 ? 0 : outstandingBalance,
      };
    });

    return NextResponse.json({ invoices: invoicesWithBalances }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch invoices API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching invoices.' },
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
  status: z.enum(['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']).optional().default('Draft'),
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const parseResult = invoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { customerId, issueDate, dueDate, status, items, notes } = parseResult.data;

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business settings not found.' }, { status: 404 });
    }

    // Auto-generate invoice number
    const prefix = business.invoicePrefix || 'INV-';
    const padding = business.invoicePadding || 4;
    const nextNum = business.nextInvoiceNumber || 1;
    const invoiceNumber = `${prefix}${String(nextNum).padStart(padding, '0')}`;

    // Calculate totals from items
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

    // Save Invoice inside an atomic transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice and nested InvoiceItems
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          status: status || 'Draft',
          taxRate: 0,
          taxAmount: calculatedTaxAmount,
          discountRate: 0,
          discountAmount: calculatedDiscountAmount,
          totalAmount: calculatedTotal,
          notes: notes || null,
          businessId: user.businessId!,
          customerId,
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

      // 2. Increment business nextInvoiceNumber sequence
      await tx.business.update({
        where: { id: user.businessId! },
        data: {
          nextInvoiceNumber: nextNum + 1,
        },
      });

      return inv;
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Invoice Created', {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
    });

    return NextResponse.json({
      message: 'Invoice created successfully.',
      invoice: {
        ...invoice,
        totalPaid: 0,
        outstandingBalance: invoice.totalAmount,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create invoice API error:', error);
    return NextResponse.json(
      { error: 'An error occurred creating invoice.' },
      { status: 500 }
    );
  }
}
