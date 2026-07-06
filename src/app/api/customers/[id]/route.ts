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

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // 1. Total Invoices
    const totalInvoicesCount = await prisma.invoice.count({
      where: { customerId: id },
    });

    // 2. Calculated Outstanding Balance
    const invoices = await prisma.invoice.findMany({
      where: { customerId: id },
      select: { id: true, totalAmount: true },
    });
    
    const invoiceIds = invoices.map((inv) => inv.id);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    let totalPaid = 0;
    if (invoiceIds.length > 0) {
      const payments = await prisma.payment.findMany({
        where: {
          invoiceId: { in: invoiceIds },
        },
        select: { amount: true },
      });
      totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
    }
    
    const outstandingBalance = totalInvoiced - totalPaid;

    // 3. Last Payment
    let lastPayment = null;
    if (invoiceIds.length > 0) {
      const dbLastPayment = await prisma.payment.findFirst({
        where: {
          invoiceId: { in: invoiceIds },
        },
        orderBy: {
          date: 'desc',
        },
      });
      if (dbLastPayment) {
        lastPayment = {
          amount: dbLastPayment.amount,
          date: dbLastPayment.date,
        };
      }
    }

    // 4. Purchase History (Invoices list)
    const purchaseHistory = await prisma.invoice.findMany({
      where: { customerId: id },
      orderBy: {
        issueDate: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      customer,
      metrics: {
        totalInvoices: totalInvoicesCount,
        outstandingBalance,
        lastPayment,
        purchaseHistory,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch customer detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching customer details.' },
      { status: 500 }
    );
  }
}

import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  businessName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const parseResult = customerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { name, businessName, phone, email, address, notes } = parseResult.data;

    // Verify ownership
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        businessName: businessName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Customer Updated', {
      id: customer.id,
      name: customer.name,
    });

    return NextResponse.json({
      message: 'Customer updated successfully.',
      customer: updatedCustomer,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update customer API error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating customer.' },
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
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer || customer.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Customer Deleted', {
      id,
      name: customer.name,
    });

    return NextResponse.json({
      message: 'Customer deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete customer API error:', error);
    return NextResponse.json(
      { error: 'An error occurred deleting customer.' },
      { status: 500 }
    );
  }
}
