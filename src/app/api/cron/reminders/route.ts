import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentReminders } from '@/lib/services/reminders';

export async function GET(request: NextRequest) {
  // Check for Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await sendPaymentReminders(month, year);
    
    console.log(`[CRON] Sent ${result.count} payment reminders for ${month}/${year}`);

    return NextResponse.json({ 
      success: true, 
      sentCount: result.count, 
      totalPending: result.totalPending,
      month, 
      year 
    });
  } catch (error) {
    console.error('[CRON] Error sending reminders:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
