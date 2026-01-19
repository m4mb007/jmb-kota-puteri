'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { NoticeTarget } from '@prisma/client';
import { createAuditLog } from '@/lib/actions/audit';

export async function createNotice(formData: FormData) {
  const session = await auth();
  
  // Only SUPER_ADMIN, JMB, STAFF can create notices
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  if (!session.user.id) {
    throw new Error('User ID missing');
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const target = formData.get('target') as NoticeTarget;

  if (!title || !content || !target) {
    throw new Error('Semua medan wajib diisi');
  }

  try {
    await prisma.notice.create({
      data: {
        title,
        content,
        target,
        createdById: session.user.id,
      },
    });

    await createAuditLog('CREATE_NOTICE', `Created notice: ${title} (Target: ${target})`);

  } catch (error: unknown) {
    console.error('Failed to create notice:', error);
    throw new Error('Gagal mencipta notis.');
  }

  revalidatePath('/dashboard/notices');
  redirect('/dashboard/notices');
}
