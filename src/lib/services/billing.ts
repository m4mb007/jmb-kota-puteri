import { prisma } from '@/lib/prisma';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email';
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/whatsapp';

export async function generateBillsLogic(month: number, year: number) {
  const units = await prisma.unit.findMany({
    include: {
      owner: true,
    },
  });

  let baseAmountAtas = 95;
  let baseAmountBawah = 88;
  let sinkingPercent = 10;

  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT "key", "value"
      FROM "SystemSetting"
      WHERE "key" IN ('BASE_MONTHLY_BILL_ATAS', 'BASE_MONTHLY_BILL_BAWAH', 'SINKING_FUND_PERCENT')
    `;

    for (const row of rows) {
      const parsed = parseFloat(row.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        if (row.key === 'BASE_MONTHLY_BILL_ATAS') {
          baseAmountAtas = parsed;
        } else if (row.key === 'BASE_MONTHLY_BILL_BAWAH') {
          baseAmountBawah = parsed;
        } else if (row.key === 'SINKING_FUND_PERCENT') {
          sinkingPercent = parsed;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching billing settings:', error);
  }

  let createdCount = 0;

  for (const unit of units) {
    const existingBillCount = await prisma.bill.count({
      where: {
        unitId: unit.id,
        month,
        year,
      },
    });

    if (existingBillCount === 0) {
      const baseAmount = unit.type === 'ATAS' ? baseAmountAtas : baseAmountBawah;
      
      const unitAdjustment = unit.monthlyAdjustmentAmount || 0;
      const totalAmount = baseAmount + unitAdjustment;

      const ratio = sinkingPercent / 100;
      const maintenanceAmount = totalAmount / (1 + ratio);
      const sinkingAmount = totalAmount - maintenanceAmount;

      // Create Maintenance Bill
      await prisma.bill.create({
        data: {
          unitId: unit.id,
          amount: parseFloat(maintenanceAmount.toFixed(2)),
          month,
          year,
          type: 'MAINTENANCE',
          status: 'PENDING',
        },
      });

      // Create Sinking Fund Bill
      await prisma.bill.create({
        data: {
          unitId: unit.id,
          amount: parseFloat(sinkingAmount.toFixed(2)),
          month,
          year,
          type: 'SINKING',
          status: 'PENDING',
        },
      });

      // Send notifications (using total amount for clarity)
      const billAmount = totalAmount;
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
