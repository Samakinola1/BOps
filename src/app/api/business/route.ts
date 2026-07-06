import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }

    return NextResponse.json({ business }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch business API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching business settings.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, address, taxNumber, currency, invoicePrefix, invoicePadding, nextInvoiceNumber } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber;
    if (currency !== undefined) updateData.currency = currency;
    if (invoicePrefix !== undefined) updateData.invoicePrefix = invoicePrefix;
    if (invoicePadding !== undefined) updateData.invoicePadding = parseInt(invoicePadding, 10);
    if (nextInvoiceNumber !== undefined) updateData.nextInvoiceNumber = parseInt(nextInvoiceNumber, 10);

    const updatedBusiness = await prisma.business.update({
      where: { id: user.businessId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Business settings updated successfully.',
      business: updatedBusiness,
    });
  } catch (error: any) {
    console.error('Update business API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating business settings.' },
      { status: 500 }
    );
  }
}
