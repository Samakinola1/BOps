import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createBackup, listBackups } from '@/lib/services/backup';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Backups are strictly reserved for the business Owner
    if (user.businessUser?.roleName !== 'Owner') {
      return NextResponse.json({ error: 'Forbidden. Only the Business Owner can manage backups.' }, { status: 403 });
    }

    const backups = listBackups();
    return NextResponse.json({ backups }, { status: 200 });
  } catch (error: any) {
    console.error('List backups API error:', error);
    const isPostgresError = error.message?.includes('PostgreSQL') || error.message?.includes('managed by');
    return NextResponse.json(
      { error: error.message || 'An error occurred listing database backups.' },
      { status: isPostgresError ? 501 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.businessUser?.roleName !== 'Owner') {
      return NextResponse.json({ error: 'Forbidden. Only the Business Owner can trigger backups.' }, { status: 403 });
    }

    const filename = await createBackup();
    return NextResponse.json({
      message: 'Database backup created successfully.',
      filename,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create backup API error:', error);
    const isPostgresError = error.message?.includes('PostgreSQL') || error.message?.includes('managed by');
    return NextResponse.json(
      { error: error.message || 'An error occurred generating database backup.' },
      { status: isPostgresError ? 501 : 500 }
    );
  }
}
