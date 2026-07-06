import { NextResponse } from 'next/server';
import path from 'path';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/services/storage';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('receipt') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No receipt file was provided.' }, { status: 400 });
    }

    // Convert file to ArrayBuffer then Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension
    const originalName = file.name;
    const ext = path.extname(originalName) || '.png';
    const fileName = `receipt-${user.businessId}-${Date.now()}${ext}`;

    // Upload using mock storage service
    const receiptUrl = await uploadFile(buffer, {
      folder: 'receipts',
      fileName,
    });

    return NextResponse.json({
      message: 'Receipt uploaded successfully.',
      receiptUrl,
    });
  } catch (error: any) {
    console.error('Receipt upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during receipt upload.' },
      { status: 500 }
    );
  }
}
