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

      if (unit.owner?.email) {
        await sendEmail({
          to: unit.owner.email,
          subject: `Invois Baharu - ${unit.unitNumber} (${month}/${year})`,
          html: EMAIL_TEMPLATES.billCreated(unit.unitNumber, billAmount, month, year),
        });
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
