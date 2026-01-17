import { NextRequest, NextResponse } from 'next/server';
import { generateBillsLogic } from '@/lib/services/billing';
import { createAuditLog } from '@/lib/actions/audit';

export async function GET(request: NextRequest) {
  // Check for Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();
    // Default to generating bills for the CURRENT month
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await generateBillsLogic(month, year);
    
    // Log success (Note: createAuditLog might need adjustment if it relies on session)
    // For cron, we might skip the standard audit log or log it differently
    // Since createAuditLog uses auth(), it might fail or log as "Unknown".
    // Let's manually log if needed or update createAuditLog to handle system actions.
    console.log(`[CRON] Generated ${result.count} bills for ${month}/${year}`);

    return NextResponse.json({ success: true, count: result.count, month, year });
  } catch (error) {
    console.error('[CRON] Error generating bills:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
