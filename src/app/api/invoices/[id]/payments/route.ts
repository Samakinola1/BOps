import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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
    const { amount, date, method, notes } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'A valid payment amount greater than zero is required.' }, { status: 400 });
    }

    if (!method) {
      return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
    }

    // Retrieve invoice and check ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice || invoice.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // Run atomically inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Payment record
      const payment = await tx.payment.create({
        data: {
          amount: parsedAmount,
          date: date ? new Date(date) : new Date(),
          method,
          notes: notes || null,
          invoiceId: id,
        },
      });

      // 2. Fetch all payments to calculate updated totals
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: id },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Determine new status
      let newStatus = invoice.status;
      if (totalPaid >= invoice.totalAmount) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partially Paid';
      }

      // 4. Update the Invoice status
      await tx.invoice.update({
        where: { id },
        data: { status: newStatus },
      });

      return { payment, totalPaid, newStatus };
    });

    return NextResponse.json({
      message: 'Payment recorded successfully.',
      payment: result.payment,
      metrics: {
        totalPaid: result.totalPaid,
        outstandingBalance: Math.max(0, invoice.totalAmount - result.totalPaid),
        status: result.newStatus,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Record payment API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred recording payment.' },
      { status: 500 }
    );
  }
}
