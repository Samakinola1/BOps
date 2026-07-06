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
    const search = searchParams.get('search') || '';

    // Build Prisma query condition
    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch customers API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching customers.' },
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const parseResult = customerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { name, businessName, phone, email, address, notes } = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        name,
        businessName: businessName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        businessId: user.businessId,
      },
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Customer Created', {
      id: customer.id,
      name: customer.name,
    });

    return NextResponse.json({
      message: 'Customer created successfully.',
      customer,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create customer API error:', error);
    return NextResponse.json(
      { error: 'An error occurred creating customer.' },
      { status: 500 }
    );
  }
}
