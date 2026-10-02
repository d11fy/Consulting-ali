import { NextRequest, NextResponse } from 'next/server';
import { processAppointmentReminders } from '@/lib/services/reminders';

export async function GET(request: NextRequest) {
  try {
    const result = await processAppointmentReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Error running reminders cron:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
