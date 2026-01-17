import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/whatsapp';

export async function sendPaymentReminders(month: number, year: number) {
  // 1. Find all PENDING bills for the specified month/year
  const unpaidBills = await prisma.bill.findMany({
    where: {
      month,
      year,
      status: 'PENDING',
    },
    include: {
      unit: {
        include: {
          owner: true,
        },
      },
    },
  });

  let sentCount = 0;

  for (const bill of unpaidBills) {
    const owner = bill.unit.owner;
    
    // Only send if owner exists and has a phone number
    if (owner && owner.phone) {
      await sendWhatsAppNotification(
        owner.phone,
        WA_TEMPLATES.paymentReminder(bill.unit.unitNumber, bill.amount, month, year)
      );
      sentCount++;
    }
  }

  return { success: true, count: sentCount, totalPending: unpaidBills.length };
}
