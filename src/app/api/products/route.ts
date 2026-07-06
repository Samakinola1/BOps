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
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const whereCondition: any = {
      businessId: user.businessId,
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
    });

    // Map calculated stock properties based on actual DB schema (quantity, reorderLevel)
    let filteredProducts = products.map(prod => ({
      ...prod,
      isLowStock: prod.quantity <= prod.reorderLevel,
    }));

    if (lowStockOnly) {
      filteredProducts = filteredProducts.filter(p => p.isLowStock);
    }

    return NextResponse.json({ products: filteredProducts }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch products API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching products.' },
      { status: 500 }
    );
  }
}

import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'Product SKU is required'),
  description: z.string().optional().nullable(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional().default(0),
  quantity: z.number().optional().default(0),
  reorderLevel: z.number().optional().default(0),
  unit: z.string().optional().default('pcs'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const parseResult = productSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { name, sku, description, sellingPrice, costPrice, quantity, reorderLevel, unit } = parseResult.data;

    const trimmedSku = sku.trim().toUpperCase();

    // Check SKU uniqueness per business
    const existing = await prisma.product.findFirst({
      where: {
        businessId: user.businessId,
        sku: { equals: trimmedSku },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
    }

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create product record using real schema keys
      const prod = await tx.product.create({
        data: {
          name: name.trim(),
          sku: trimmedSku,
          description: description || null,
          sellingPrice: sellingPrice,
          costPrice: costPrice,
          quantity: quantity,
          reorderLevel: reorderLevel,
          unit: unit || 'pcs',
          businessId: user.businessId!,
        },
      });

      // 2. Log initial stock level transaction in ledger
      if (quantity > 0) {
        await tx.inventoryTransaction.create({
          data: {
            type: 'Adjustment',
            quantity: quantity,
            notes: 'Initial stock upload on product creation.',
            productId: prod.id,
          },
        });
      }

      return prod;
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Product Registered', {
      id: product.id,
      sku: product.sku,
      name: product.name,
    });

    return NextResponse.json({
      message: 'Product created successfully.',
      product: {
        ...product,
        isLowStock: product.quantity <= product.reorderLevel,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create product API error:', error);
    return NextResponse.json(
      { error: 'An error occurred creating product.' },
      { status: 500 }
    );
  }
}
