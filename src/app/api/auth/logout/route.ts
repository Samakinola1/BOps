import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/services/activity';


export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (user && user.businessId) {
      await logActivity(user.id, user.businessId, 'Logout', { email: user.email });
    }

    const response = NextResponse.json({ message: 'Logged out successfully.' });
    
    // Clear Cookie by setting Max-Age=0
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.append(
      'Set-Cookie',
      `auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isProd ? '; Secure' : ''}`
    );

    return response;
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during logout.' },
      { status: 500 }
    );
  }
}
