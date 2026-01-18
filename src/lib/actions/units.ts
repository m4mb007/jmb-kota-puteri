'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuditLog } from '@/lib/actions/audit';
import { auth } from '@/auth';

export async function createUnit(formData: FormData) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const unitNumber = formData.get('unitNumber') as string;
  const lotNumber = formData.get('lotNumber') as string;
  const type = formData.get('type') as any;
  const parking1 = formData.get('parking1') as string;
  const parking2 = formData.get('parking2') as string;

  if (!unitNumber || !lotNumber || !type) {
    throw new Error('Sila isi semua maklumat yang diperlukan.');
  }

  try {
    // Validate Parking availability first
    const parkingNumbers = [parking1, parking2].filter(p => p && p.trim() !== '');
    
    // Check if any provided parking already exists and is taken
    for (const pNum of parkingNumbers) {
      const existingParking = await prisma.parking.findUnique({
        where: { number: pNum },
        include: { unit: true }
      });

      if (existingParking && existingParking.unitId) {
        throw new Error(`Parking ${pNum} sudah dimiliki oleh unit ${existingParking.unit?.unitNumber || '(Tidak Diketahui)'}.`);
      }
    }

    // Find or create Lot
    let lot = await prisma.lot.findUnique({
      where: { lotNumber },
    });

    if (!lot) {
      lot = await prisma.lot.create({
        data: { lotNumber },
      });
    }

    // Create Unit
    const unit = await prisma.unit.create({
      data: {
        unitNumber,
        type,
        lotId: lot.id,
      },
    });

    // Create/Link Parkings
    for (const pNum of parkingNumbers) {
      // Upsert: Create if not exists, Update (link) if exists
      // We already checked availability above, so update is safe
      await prisma.parking.upsert({
        where: { number: pNum },
        update: {
          unitId: unit.id,
          type: 'ACCESSORY', // Force type to ACCESSORY for unit parkings
        },
        create: {
          number: pNum,
          type: 'ACCESSORY',
          unitId: unit.id,
        },
      });
    }

    const parkingInfo = parkingNumbers.length > 0 ? ` with Parkings: ${parkingNumbers.join(', ')}` : '';
    await createAuditLog('CREATE_UNIT', `Created unit ${unitNumber} (Lot ${lotNumber}, Type ${type})${parkingInfo}`);

  } catch (error: any) {
    console.error('Failed to create unit:', error);
    // Return specific error message if it's our custom error
    if (error.message && error.message.includes('Parking')) {
      throw error; 
    }
    // Check for Prisma unique constraint violation (e.g., unit number)
    if (error.code === 'P2002') {
       throw new Error('Nombor unit sudah wujud.');
    }
    throw new Error('Gagal mencipta unit. Sila cuba lagi.');
  }

  revalidatePath('/dashboard/units');
  redirect('/dashboard/units');
}

export async function updateUnit(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const ownerIdRaw = formData.get('ownerId') as string;
  const tenantIdRaw = formData.get('tenantId') as string;
  const manualArrearsRaw = formData.get('manualArrearsAmount') as string;
  const monthlyAdjustmentRaw = formData.get('monthlyAdjustmentAmount') as string;
  const type = formData.get('type') as any;

  const ownerId = ownerIdRaw === '_none' ? null : ownerIdRaw;
  const tenantId = tenantIdRaw === '_none' ? null : tenantIdRaw;
  const manualArrearsAmount = manualArrearsRaw ? Number(manualArrearsRaw) : 0;
  const monthlyAdjustmentAmount = monthlyAdjustmentRaw ? Number(monthlyAdjustmentRaw) : 0;

  try {
    if (ownerId) {
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (owner && !owner.handoverDate) {
        throw new Error('Pemilik ini belum mempunyai Tarikh Terima Kunci (Handover Date).');
      }
    }

    // Build update data object
    const updateData: any = {
      manualArrearsAmount,
      monthlyAdjustmentAmount,
    };

    // Add unit type if provided
    if (type) {
      updateData.type = type;
    }

    // Handle owner relation - use connect/disconnect pattern
    if (ownerId) {
      updateData.owner = {
        connect: { id: ownerId },
      };
    } else {
      updateData.owner = {
        disconnect: true,
      };
    }

    // Handle tenant relation - use connect/disconnect pattern
    if (tenantId) {
      updateData.tenant = {
        connect: { id: tenantId },
      };
    } else {
      updateData.tenant = {
        disconnect: true,
      };
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
    });

    const typeInfo = type ? `, Type=${type}` : '';
    await createAuditLog('UPDATE_UNIT', `Updated unit ${unit.unitNumber}: Owner=${ownerId || 'None'}, Tenant=${tenantId || 'None'}${typeInfo}`);

  } catch (error) {
    console.error('Failed to update unit:', error);
    throw new Error('Gagal mengemaskini unit.');
  }

  revalidatePath('/dashboard/units');
  revalidatePath(`/dashboard/units/${id}`);
  redirect('/dashboard/units');
}

export async function deactivateUnit(id: string) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const unit = await prisma.unit.findUnique({
    where: { id },
  });

  if (!unit) {
    throw new Error('Unit tidak dijumpai.');
  }

  await prisma.unit.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await createAuditLog('DEACTIVATE_UNIT', `Deactivated unit ${unit.unitNumber}`);

  revalidatePath('/dashboard/units');
  revalidatePath(`/dashboard/units/${id}`);
}

export async function payManualArrears(formData: FormData) {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const unitId = formData.get('unitId') as string;
  const amountStr = formData.get('amount') as string;
  const dateStr = formData.get('date') as string | null;
  const reference = formData.get('reference') as string | null;

  if (!unitId || !amountStr) {
    throw new Error('Sila isi unit dan jumlah bayaran.');
  }

  const amount = parseFloat(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Jumlah bayaran tidak sah.');
  }

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    throw new Error('Unit tidak dijumpai.');
  }

  const fund = await prisma.fund.findUnique({
    where: { code: 'MAINTENANCE' },
  });

  if (!fund) {
    throw new Error('Dana MAINTENANCE tidak dijumpai.');
  }

  const paymentDate = dateStr ? new Date(dateStr) : new Date();
  const currentManual = unit.manualArrearsAmount || 0;
  const newManual = Math.max(0, currentManual - amount);

  await prisma.$transaction([
    prisma.unit.update({
      where: { id: unitId },
      data: {
        manualArrearsAmount: newManual,
      },
    }),
    prisma.incomeCollection.create({
      data: {
        amount,
        date: paymentDate,
        source: fund.code,
        description:
          reference && reference.trim().length > 0
            ? reference.trim()
            : `Bayaran ansuran tunggakan untuk unit ${unit.unitNumber}`,
        unitId,
        fundId: fund.id,
      },
    }),
  ]);

  await createAuditLog(
    'PAY_MANUAL_ARREARS',
    `Bayaran ansuran RM ${amount.toFixed(2)} untuk tunggakan unit ${unit.unitNumber}`
  );

  revalidatePath('/dashboard/units');
  revalidatePath('/dashboard/finance');
}
