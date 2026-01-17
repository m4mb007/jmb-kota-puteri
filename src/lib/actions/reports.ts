'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getFinancialReport(year: number) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // 1. Get Funds
  const funds = await prisma.fund.findMany();

  // 2. Aggregate Income per Fund
  const incomeByFund = await Promise.all(funds.map(async (fund) => {
    const aggregate = await prisma.incomeCollection.aggregate({
      where: {
        fundId: fund.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });
    return {
      fundId: fund.id,
      fundName: fund.name,
      totalIncome: aggregate._sum.amount || 0,
    };
  }));

  // 3. Aggregate Expenses per Fund
  const expenseByFund = await Promise.all(funds.map(async (fund: any) => {
    const aggregate = await prisma.expense.aggregate({
      where: {
        fundId: fund.id,
        status: 'APPROVED',
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });
    return {
      fundId: fund.id,
      fundName: fund.name,
      totalExpense: aggregate._sum.amount || 0,
    };
  }));

  // 4. Expenses by Category
  const categories = await prisma.expenseCategory.findMany();
  const expenseByCategory = await Promise.all(categories.map(async (cat: any) => {
    const aggregate = await prisma.expense.aggregate({
      where: {
        categoryId: cat.id,
        status: 'APPROVED',
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });
    
    // Only return if there are expenses
    if ((aggregate._sum.amount || 0) === 0) return null;

    return {
      categoryName: cat.name,
      total: aggregate._sum.amount || 0,
    };
  }));

  // 5. List of All Approved Expenses (for detail view)
  const expenses = await prisma.expense.findMany({
    where: {
      status: 'APPROVED',
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      fund: true,
    },
    orderBy: { expenseDate: 'asc' },
  });

  return {
    year,
    incomeByFund,
    expenseByFund,
    expenseByCategory: expenseByCategory.filter(Boolean) as { categoryName: string; total: number }[],
    expenses,
    generatedAt: new Date(),
  };
}
