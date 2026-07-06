import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const productImportSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'Product SKU is required'),
  description: z.string().optional().nullable(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional().default(0),
  quantity: z.number().optional().default(0),
  reorderLevel: z.number().optional().default(0),
  unit: z.string().optional().default('pcs'),
});

const bulkImportPayloadSchema = z.object({
  products: z.array(productImportSchema).min(1, 'No products provided for import.'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Gated to managers/admins with write:inventory or equivalent permissions
    if (user.businessUser?.roleName !== 'Owner' && user.businessUser?.roleName !== 'Admin' && user.businessUser?.roleName !== 'Manager') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to import inventory.' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = bulkImportPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { products } = parseResult.data;
    
    // Process bulk insert atomically
    const importedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const prod of products) {
        const trimmedSku = prod.sku.trim().toUpperCase();
        
        // Skip or error on duplicates. We will skip duplicates to make it friendly
        const existing = await tx.product.findFirst({
          where: {
            businessId: user.businessId!,
            sku: trimmedSku,
          },
        });

        if (existing) continue; // Skip existing SKUs

        const createdProd = await tx.product.create({
          data: {
            name: prod.name.trim(),
            sku: trimmedSku,
            description: prod.description || null,
            sellingPrice: prod.sellingPrice,
            costPrice: prod.costPrice,
            quantity: prod.quantity,
            reorderLevel: prod.reorderLevel,
            unit: prod.unit,
            businessId: user.businessId!,
          },
        });

        // Log initial stock ledger transaction
        if (prod.quantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              type: 'Adjustment',
              quantity: prod.quantity,
              notes: 'Bulk stock import upload.',
              productId: createdProd.id,
            },
          });
        }

        count++;
      }
      return count;
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Bulk Products Imported', {
      totalUploaded: products.length,
      successfullyImported: importedCount,
    });

    return NextResponse.json({
      message: `Bulk import completed. Successfully imported ${importedCount} of ${products.length} products.`,
      importedCount,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk products import API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during bulk product import.' },
      { status: 500 }
    );
  }
}
