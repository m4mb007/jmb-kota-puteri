'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ComplaintStatus, ComplaintType } from '@prisma/client';
import { auth } from '@/auth';

import { createAuditLog } from '@/lib/actions/audit';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email';

export async function createComplaint(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as ComplaintType;

  // Simple validation
  if (!title || !description || !type) {
    throw new Error('Missing required fields');
  }

  const complaint = await prisma.complaint.create({
    data: {
      title,
      description,
      type,
      userId: session.user.id,
      status: 'OPEN',
    },
  });

  await createAuditLog('CREATE_COMPLAINT', `Created complaint: ${title} (${complaint.id})`);

  revalidatePath('/dashboard/complaints');
  redirect('/dashboard/complaints');
}

export async function updateComplaintStatus(id: string, status: ComplaintStatus) {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: { status },
    include: {
      user: true,
    },
  });

  await createAuditLog('UPDATE_COMPLAINT_STATUS', `Updated complaint ${id} to ${status}`);

  // Send email notification to user
  if (complaint.user.email) {
    await sendEmail({
      to: complaint.user.email,
      subject: `Kemaskini Status Aduan - ${complaint.title}`,
      html: EMAIL_TEMPLATES.complaintStatusUpdated(complaint.id, status),
    });
  }

  revalidatePath('/dashboard/complaints');
}
