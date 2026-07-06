import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Session/Me API error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching session details.' },
      { status: 500 }
    );
  }
}
