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

    // Retrieve quotation and its nested items
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!quotation || quotation.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    // Retrieve business configuration for invoice numbering sequences
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

    // Convert Quotation to Invoice in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice and nested InvoiceItems
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          issueDate: new Date(), // Today
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
          status: 'Draft',
          taxRate: 0,
          taxAmount: quotation.taxAmount,
          discountRate: 0,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          notes: quotation.notes,
          businessId: user.businessId!,
          customerId: quotation.customerId,
          items: {
            create: quotation.items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              discountRate: item.discountRate,
              totalAmount: item.totalAmount,
              productId: item.productId,
            })),
          },
        },
      });

      // 2. Update Business invoice number sequence
      await tx.business.update({
        where: { id: user.businessId! },
        data: {
          nextInvoiceNumber: nextNum + 1,
        },
      });

      // 3. Update Quotation Status to Accepted
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: 'Accepted',
        },
      });

      return inv;
    });

    return NextResponse.json({
      message: 'Quotation converted to Invoice successfully.',
      invoice,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Convert quotation to invoice API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during conversion.' },
      { status: 500 }
    );
  }
}
