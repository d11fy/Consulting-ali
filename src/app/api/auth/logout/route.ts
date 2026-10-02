import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth/service';

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await logoutUser({ ipAddress, userAgent });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
