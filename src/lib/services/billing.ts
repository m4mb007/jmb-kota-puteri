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

  // Fetch base amounts for different unit types
  let baseAmountAtas = 95;  // Default for ATAS (upper)
  let baseAmountBawah = 88; // Default for BAWAH (lower)

  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT "key", "value"
      FROM "SystemSetting"
      WHERE "key" IN ('BASE_MONTHLY_BILL_ATAS', 'BASE_MONTHLY_BILL_BAWAH')
    `;

    for (const row of rows) {
      const parsed = parseFloat(row.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        if (row.key === 'BASE_MONTHLY_BILL_ATAS') {
          baseAmountAtas = parsed;
        } else if (row.key === 'BASE_MONTHLY_BILL_BAWAH') {
          baseAmountBawah = parsed;
        }
      }
    }
  } catch (error) {
    // Use defaults if query fails
    console.error('Error fetching billing settings:', error);
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
      // Select base amount based on unit type
      const baseAmount = unit.type === 'ATAS' ? baseAmountAtas : baseAmountBawah;
      
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
