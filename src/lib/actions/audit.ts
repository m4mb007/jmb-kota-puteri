'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function createAuditLog(action: string, details?: string) {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    // In a real app, maybe log as 'SYSTEM' or anonymous if allowed, 
    // but here we enforce user.
    console.warn('Audit log attempt without user session:', action);
    return;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw, just log error, so we don't block the main action
  }
}
