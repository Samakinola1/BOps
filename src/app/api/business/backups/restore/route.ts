import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { restoreBackup } from '@/lib/services/backup';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.businessId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Database restoration is restricted exclusively to the Business Owner
    if (user.businessUser?.roleName !== 'Owner') {
      return NextResponse.json({ error: 'Forbidden. Only the Business Owner can restore backups.' }, { status: 403 });
    }

    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'Backup filename is required.' }, { status: 400 });
    }

    const success = await restoreBackup(filename);

    if (success) {
      return NextResponse.json({
        message: `Database successfully restored from ${filename}.`,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        error: 'Failed to restore database.',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Restore backup API error:', error);
    const isPostgresError = error.message?.includes('PostgreSQL') || error.message?.includes('managed by');
    return NextResponse.json(
      { error: error.message || 'An error occurred during database restoration.' },
      { status: isPostgresError ? 501 : 500 }
    );
  }
}
