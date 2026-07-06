import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const adjustSchema = z.object({
  type: z.enum(['Purchase', 'Sale', 'Adjustment', 'Return']),
  quantityChange: z.number().refine(val => val !== 0, 'Quantity change cannot be zero'),
  notes: z.string().optional().nullable(),
});

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

    // Validate request body
    const parseResult = adjustSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { type, quantityChange, notes } = parseResult.data;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Lock and read product
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product || product.businessId !== user.businessId) {
        throw new Error('Product record was not found.');
      }

      const currentStock = product.quantity;
      const newStock = currentStock + quantityChange;

      // 2. Prevent negative stock check
      if (newStock < 0) {
        throw new Error(`Deduction exceeds available stock. Only ${currentStock} item(s) available in stock.`);
      }

      // 3. Create the transaction ledger entry
      await tx.inventoryTransaction.create({
        data: {
          type,
          quantity: quantityChange,
          notes: notes || null,
          productId: id,
        },
      });

      // 4. Update the stock level (quantity) on the product
      const updated = await tx.product.update({
        where: { id },
        data: {
          quantity: newStock,
        },
      });

      return updated;
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Inventory Adjusted', {
      productId: updatedProduct.id,
      sku: updatedProduct.sku,
      type,
      change: quantityChange,
      quantityAfter: updatedProduct.quantity,
    });

    return NextResponse.json({
      message: 'Stock adjusted successfully.',
      product: {
        ...updatedProduct,
        isLowStock: updatedProduct.quantity <= updatedProduct.reorderLevel,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Adjust stock API error:', error);
    // Determine appropriate response code based on error message
    const isValidationError = error.message.includes('stock') || error.message.includes('found');
    return NextResponse.json(
      { error: error.message || 'An error occurred during stock adjustment.' },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
