import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const customerImportSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  businessName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bulkImportPayloadSchema = z.object({
  customers: z.array(customerImportSchema).min(1, 'No customers provided for import.'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.businessUser?.roleName !== 'Owner' && user.businessUser?.roleName !== 'Admin' && user.businessUser?.roleName !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to import customers.' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = bulkImportPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { customers } = parseResult.data;

    // Process bulk insert atomically
    const importedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const cust of customers) {
        // Skip duplicates based on email per business if email provided
        if (cust.email) {
          const existing = await tx.customer.findFirst({
            where: {
              businessId: user.businessId!,
              email: cust.email,
            },
          });
          if (existing) continue;
        }

        await tx.customer.create({
          data: {
            name: cust.name.trim(),
            businessName: cust.businessName || null,
            phone: cust.phone || null,
            email: cust.email || null,
            address: cust.address || null,
            notes: cust.notes || null,
            businessId: user.businessId!,
          },
        });
        count++;
      }
      return count;
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Bulk Customers Imported', {
      totalUploaded: customers.length,
      successfullyImported: importedCount,
    });

    return NextResponse.json({
      message: `Bulk import completed. Successfully imported ${importedCount} of ${customers.length} customers.`,
      importedCount,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk customers import API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during bulk customer import.' },
      { status: 500 }
    );
  }
}
