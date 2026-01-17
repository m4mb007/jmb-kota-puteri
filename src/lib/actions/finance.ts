'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/actions/audit';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

export async function getFunds() {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const funds = await prisma.fund.findMany({
    include: {
      _count: {
        select: {
          expenses: true,
          incomeCollections: true,
        },
      },
    },
  });

  // Calculate balances dynamically
  // Balance = Total Income - Total Expense
  const fundsWithBalance = await Promise.all(funds.map(async (fund: any) => {
    const incomeAgg = await prisma.incomeCollection.aggregate({
      where: { fundId: fund.id },
      _sum: { amount: true },
    });

    const expenseAgg = await prisma.expense.aggregate({
      where: { 
        fundId: fund.id,
        status: 'APPROVED', // Only approved expenses deduct from balance
      },
      _sum: { amount: true },
    });

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;

    return {
      ...fund,
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
    };
  }));

  return fundsWithBalance;
}

export async function getExpenseCategories() {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  return await prisma.expenseCategory.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  if (!session.user.id) {
    throw new Error('User ID missing');
  }

  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const categoryId = formData.get('categoryId') as string;
  const fundId = formData.get('fundId') as string;
  const dateStr = formData.get('date') as string;
  const file = formData.get('attachment') as File | null;

  if (!description || !amountStr || !categoryId || !fundId || !dateStr) {
    throw new Error('Missing required fields');
  }

  let attachmentUrl = null;
  if (file && file.size > 0) {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.');
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `expense-${timestamp}.${extension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'expenses');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
    attachmentUrl = `/uploads/expenses/${filename}`;
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount: parseFloat(amountStr),
      expenseDate: new Date(dateStr),
      categoryId,
      fundId,
      createdById: session.user.id,
      attachmentUrl,
      status: 'PENDING',
    },
  });

  await createAuditLog('CREATE_EXPENSE', `Created expense: ${description} (${expense.amount})`);
  revalidatePath('/dashboard/finance');
  return expense;
}

export async function approveExpense(id: string) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: session.user.id,
    },
  });

  await createAuditLog('APPROVE_EXPENSE', `Approved expense: ${expense.description}`);
  revalidatePath('/dashboard/finance');
}

export async function rejectExpense(id: string) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedById: session.user.id, // Records who rejected it too
    },
  });

  await createAuditLog('REJECT_EXPENSE', `Rejected expense: ${expense.description}`);
  revalidatePath('/dashboard/finance');
}

export async function getExpenses(filters?: { fundId?: string; status?: 'PENDING' | 'APPROVED' | 'REJECTED'; month?: number; year?: number }) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const where: any = {};
  if (filters?.fundId) where.fundId = filters.fundId;
  if (filters?.status) where.status = filters.status;
  
  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0); // Last day of month
    where.expenseDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  return await prisma.expense.findMany({
    where,
    include: {
      category: true,
      fund: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  });
}

export async function getIncomeCollections(filters?: { fundId?: string; month?: number; year?: number }) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const where: any = {};
  if (filters?.fundId) where.fundId = filters.fundId;
  
  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  return await prisma.incomeCollection.findMany({
    where,
    include: {
      fund: true,
      unit: true,
    },
    orderBy: { date: 'desc' },
  });
}

export async function createManualIncome(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const description = formData.get('description') as string;
  const amountStr = formData.get('amount') as string;
  const fundId = formData.get('fundId') as string;
  const dateStr = formData.get('date') as string;

  if (!description || !amountStr || !fundId || !dateStr) {
    throw new Error('Missing required fields');
  }

  const fund = await prisma.fund.findUnique({ where: { id: fundId } });
  if (!fund) throw new Error('Fund not found');

  const income = await prisma.incomeCollection.create({
    data: {
      amount: parseFloat(amountStr),
      date: new Date(dateStr),
      source: fund.code,
      description,
      fundId,
    },
  });

  await createAuditLog('CREATE_INCOME', `Created manual income: ${description} (${income.amount})`);
  revalidatePath('/dashboard/finance');
  return income;
}
