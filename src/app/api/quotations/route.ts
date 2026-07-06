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
    const status = searchParams.get('status') || '';

    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (status) {
      whereCondition.status = status;
    }

    const quotations = await prisma.quotation.findMany({
      where: whereCondition,
      include: {
        customer: {
          select: { name: true, businessName: true },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ quotations }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch quotations API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching quotations.' },
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
    const { customerId, issueDate, expiryDate, status, items, notes } = body;

    if (!customerId || !issueDate || !expiryDate || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Customer, dates, and at least one line item are required.' }, { status: 400 });
    }

    // Retrieve business prefix/padding configurations
    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business settings not found.' }, { status: 404 });
    }

    // Auto-generate sequential Quotation Number
    const count = await prisma.quotation.count({
      where: { businessId: user.businessId },
    });
    const padding = business.invoicePadding || 4;
    const quoteNumber = `QT-${String(count + 1).padStart(padding, '0')}`;

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

    // Create Quotation record inside transaction
    const quotation = await prisma.$transaction(async (tx) => {
      return tx.quotation.create({
        data: {
          quoteNumber,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
          status: status || 'Draft',
          taxRate: 0, // In this model we sum individual item taxes
          taxAmount: calculatedTaxAmount,
          discountRate: 0, // Sum individual item discounts
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
        },
      });
    });

    return NextResponse.json({
      message: 'Quotation created successfully.',
      quotation,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create quotation API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating quotation.' },
      { status: 500 }
    );
  }
}
