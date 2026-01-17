import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/v1/bills:
 *   get:
 *     summary: Get bills for the current user
 *     description: Returns a list of bills associated with units owned or rented by the current user. Optional status filter is supported.
 *     tags:
 *       - Billing
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, REJECTED, APPROVED]
 *         description: Optional status filter. If not provided, all statuses are returned.
 *     responses:
 *       200:
 *         description: List of bills
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   month:
 *                     type: integer
 *                   year:
 *                     type: integer
 *                   type:
 *                     type: string
 *                     enum: [MAINTENANCE, SINKING]
 *                   status:
 *                     type: string
 *                     enum: [PENDING, PAID, REJECTED, APPROVED]
 *                   unit:
 *                     type: object
 *                     properties:
 *                       unitNumber:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  const userUnits = await prisma.unit.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { tenantId: session.user.id },
      ],
    },
    select: { id: true },
  });

  const unitIds = userUnits.map((u: { id: string }) => u.id);

  if (unitIds.length === 0) {
    return NextResponse.json([]);
  }

  const whereClause: {
    unitId: { in: string[] };
    status?: string;
  } = {
    unitId: { in: unitIds },
  };

  if (
    statusFilter === 'PENDING' ||
    statusFilter === 'PAID' ||
    statusFilter === 'REJECTED' ||
    statusFilter === 'APPROVED'
  ) {
    whereClause.status = statusFilter;
  }

  const bills = await prisma.bill.findMany({
    where: whereClause as any,
    include: {
      unit: {
        select: { unitNumber: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(bills);
}
