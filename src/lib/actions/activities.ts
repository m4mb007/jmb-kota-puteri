'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/actions/audit';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email';
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/whatsapp';

export async function createActivity(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const dateStr = formData.get('date') as string;
  const location = formData.get('location') as string;
  const unitId = formData.get('unitId') as string;

  if (!title || !description || !dateStr) {
    throw new Error('Sila isi semua maklumat yang diperlukan.');
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Tarikh tidak sah.');
  }

  let selectedUnitId: string | null = null;

  if (unitId && unitId !== '_none') {
    const userUnits = await prisma.unit.findMany({
      where: {
        isActive: true,
        OR: [
          { ownerId: session.user.id },
          { tenantId: session.user.id },
        ],
      },
      select: { id: true },
    });

    const allowedUnitIds = userUnits.map((u: { id: string }) => u.id);
    if (!allowedUnitIds.includes(unitId)) {
      throw new Error('Anda hanya boleh memohon bagi unit anda sendiri.');
    }
    selectedUnitId = unitId;
  }

  const activity = await prisma.activityRequest.create({
    data: {
      title,
      description,
      date,
      location: location || null,
      status: 'PENDING',
      createdById: session.user.id,
      unitId: selectedUnitId,
    },
  });

  await createAuditLog(
    'CREATE_ACTIVITY_REQUEST',
    `Permohonan aktiviti ${activity.title} (${activity.id})`
  );

  revalidatePath('/dashboard/activities');
  redirect('/dashboard/activities');
}

export async function updateActivityStatus(
  id: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.activityRequest.update({
    where: { id },
    data: {
      status,
      approvedById: status === 'APPROVED' || status === 'REJECTED' ? session.user.id : null,
    },
    include: {
      createdBy: true,
    },
  });

  await createAuditLog(
    'UPDATE_ACTIVITY_STATUS',
    `Kemaskini status aktiviti ${updated.id} kepada ${status}`
  );

  if (status === 'APPROVED') {
    const userEmail = updated.createdBy.email;
    const userPhone = updated.createdBy.phone;
    const activityDate = updated.date;
    const location = updated.location;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: 'Permohonan Aktiviti Diluluskan',
        html: EMAIL_TEMPLATES.activityApproved(updated.title, activityDate, location),
      });
    }

    if (userPhone) {
      await sendWhatsAppNotification(
        userPhone,
        WA_TEMPLATES.activityApproved(updated.title, activityDate, location)
      );
    }
  }

  revalidatePath('/dashboard/activities');
}
