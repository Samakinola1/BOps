import { NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/services/storage';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No logo file was provided.' }, { status: 400 });
    }

    // Convert file to ArrayBuffer then Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension
    const originalName = file.name;
    const ext = path.extname(originalName) || '.png';
    const fileName = `logo-${user.businessId}-${Date.now()}${ext}`;

    // Upload using mock/S3 storage service
    const logoUrl = await uploadFile(buffer, {
      folder: 'logos',
      fileName,
    });

    // Save URL to the business profile
    const updatedBusiness = await prisma.business.update({
      where: { id: user.businessId },
      data: { logoUrl },
    });

    return NextResponse.json({
      message: 'Logo uploaded successfully.',
      logoUrl,
      business: updatedBusiness,
    });
  } catch (error: any) {
    console.error('Logo upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during logo upload.' },
      { status: 500 }
    );
  }
}
