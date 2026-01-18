import { prisma } from '@/lib/prisma';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email';
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/whatsapp';
import { createAuditLog } from '@/lib/actions/audit';

export async function generateBillsLogic(month: number, year: number) {
  const units = await prisma.unit.findMany({
    include: {
      owner: true,
    },
  });

  let baseAmount = 88;

  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT "value"
      FROM "SystemSetting"
      WHERE "key" = 'BASE_MONTHLY_BILL'
      LIMIT 1
    `;

    const raw = rows[0]?.value;
    const parsed = raw ? parseFloat(raw) : NaN;
    baseAmount = !Number.isFinite(parsed) || parsed <= 0 ? 88 : parsed;
  } catch (error) {
    baseAmount = 88;
  }

  let createdCount = 0;

  for (const unit of units) {
    const existingBill = await prisma.bill.findFirst({
      where: {
        unitId: unit.id,
        month,
        year,
      },
    });

    if (!existingBill) {
      // Calculate bill amount: baseAmount + unit's monthly adjustment
      const unitAdjustment = unit.monthlyAdjustmentAmount || 0;
      const billAmount = baseAmount + unitAdjustment;

      await prisma.bill.create({
        data: {
          unitId: unit.id,
          amount: billAmount,
          month,
          year,
          status: 'PENDING',
        },
      });

      // Send notifications
      console.log(`📧 Checking notification for Unit ${unit.unitNumber}...`);
      console.log(`Owner email: ${unit.owner?.email || 'NOT SET'}`);
      console.log(`Owner phone: ${unit.owner?.phone || 'NOT SET'}`);
      
      if (unit.owner?.email) {
        console.log(`✉️ Sending email to ${unit.owner.email} for unit ${unit.unitNumber}`);
        await sendEmail({
          to: unit.owner.email,
          subject: `Invois Baharu - ${unit.unitNumber} (${month}/${year})`,
          html: EMAIL_TEMPLATES.billCreated(unit.unitNumber, billAmount, month, year),
        });
      } else {
        console.log(`⚠️ No email address for unit ${unit.unitNumber} - skipping email notification`);
      }

      if (unit.owner?.phone) {
        await sendWhatsAppNotification(
          unit.owner.phone,
          WA_TEMPLATES.billCreated(unit.unitNumber, billAmount, month, year)
        );
      }

      createdCount++;
    }
  }

  return { success: true, count: createdCount };
}
