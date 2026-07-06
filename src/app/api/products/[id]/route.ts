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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!product || product.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        isLowStock: product.quantity <= product.reorderLevel,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Fetch product detail API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching product details.' },
      { status: 500 }
    );
  }
}

import { z } from 'zod';
import { logActivity } from '@/lib/services/activity';

const productUpdateSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty').optional(),
  sku: z.string().min(1, 'SKU cannot be empty').optional(),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional(),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative').optional(),
  reorderLevel: z.number().min(0, 'Reorder limit must be non-negative').optional(),
  unit: z.string().optional(),
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

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Validate request body
    const parseResult = productUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const valData = parseResult.data;
    const updateData: any = {};

    if (valData.name !== undefined) updateData.name = valData.name.trim();
    if (valData.sku !== undefined) {
      const trimmedSku = valData.sku.trim().toUpperCase();
      // Check unique SKU
      const existing = await prisma.product.findFirst({
        where: {
          businessId: user.businessId,
          sku: { equals: trimmedSku },
          id: { not: id },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
      }
      updateData.sku = trimmedSku;
    }
    if (valData.description !== undefined) updateData.description = valData.description || null;
    if (valData.costPrice !== undefined) updateData.costPrice = valData.costPrice;
    if (valData.sellingPrice !== undefined) updateData.sellingPrice = valData.sellingPrice;
    if (valData.reorderLevel !== undefined) updateData.reorderLevel = valData.reorderLevel;
    if (valData.unit !== undefined) updateData.unit = valData.unit || 'pcs';

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Product Updated', {
      id: product.id,
      sku: updatedProduct.sku,
      name: updatedProduct.name,
    });

    return NextResponse.json({
      message: 'Product updated successfully.',
      product: {
        ...updatedProduct,
        isLowStock: updatedProduct.quantity <= updatedProduct.reorderLevel,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update product API error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating product details.' },
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

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || product.businessId !== user.businessId) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    // Record activity
    await logActivity(user.id, user.businessId, 'Product Deleted', {
      id,
      sku: product.sku,
      name: product.name,
    });

    return NextResponse.json({
      message: 'Product deleted successfully.',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Delete product API error:', error);
    return NextResponse.json(
      { error: 'An error occurred deleting product.' },
      { status: 500 }
    );
  }
}
