import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile of the currently logged-in user
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Current user profile with arrears and units
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 icNumber:
 *                   type: string
 *                 gender:
 *                   type: string
 *                 religion:
 *                   type: string
 *                 units:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       unitNumber:
 *                         type: string
 *                       manualArrearsAmount:
 *                         type: number
 *                       systemArrearsAmount:
 *                         type: number
 *                       totalArrearsAmount:
 *                         type: number
 *                       pendingBillCount:
 *                         type: integer
 *                 arrears:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                       description: Jumlah tunggakan bil (manual + sistem) dalam RM
 *                     billCount:
 *                       type: integer
 *                       description: Bilangan bil PENDING dalam sistem
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      icNumber: true,
      gender: true,
      religion: true,
      // Exclude password
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const arrears = await prisma.bill.aggregate({
    where: {
      status: 'PENDING',
      unit: {
        OR: [
          { ownerId: user.id },
          { tenantId: user.id },
        ],
      },
    },
    _sum: {
      amount: true,
    },
    _count: {
      _all: true,
    },
  });

  const units = await prisma.unit.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { tenantId: user.id },
      ],
    },
    select: {
      id: true,
      unitNumber: true,
      manualArrearsAmount: true,
    },
  });

  const unitIds = units.map((u: any) => u.id as string);

  const manualArrearsTotal = units.reduce(
    (sum: number, u: { manualArrearsAmount: number }) => sum + (u.manualArrearsAmount || 0),
    0
  );

  const systemArrearsAmount = arrears._sum.amount || 0;

  const systemMap = new Map<string, { total: number; count: number }>();

  if (unitIds.length > 0) {
    const pendingBillsByUnit = await prisma.bill.findMany({
      where: {
        unitId: { in: unitIds },
        status: 'PENDING',
      },
      select: {
        unitId: true,
        amount: true,
      },
    });

    for (const bill of pendingBillsByUnit) {
      const billUnitId = bill.unitId as string;
      const current = systemMap.get(billUnitId) || { total: 0, count: 0 };
      current.total += Number(bill.amount || 0);
      current.count += 1;
      systemMap.set(billUnitId, current);
    }
  }

  const unitsWithArrears = units.map((unit: any) => {
    const manual = unit.manualArrearsAmount || 0;
    const system = systemMap.get(unit.id as string) || { total: 0, count: 0 };
    const total = manual + system.total;

    return {
      ...unit,
      systemArrearsAmount: system.total,
      totalArrearsAmount: total,
      pendingBillCount: system.count,
    };
  });

  return NextResponse.json({
    ...user,
    units: unitsWithArrears,
    arrears: {
      totalAmount: systemArrearsAmount + manualArrearsTotal,
      billCount: arrears._count._all || 0,
    },
  });
}
