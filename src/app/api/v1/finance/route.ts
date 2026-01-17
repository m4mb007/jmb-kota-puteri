import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getFunds } from '@/lib/actions/finance';

/**
 * @swagger
 * /api/v1/finance:
 *   get:
 *     summary: Get finance summary (Funds Overview)
 *     description: Returns a list of funds with their current balances, total income, and total expenses.
 *     tags:
 *       - Finance
 *     responses:
 *       200:
 *         description: List of funds with balances
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *                   balance:
 *                     type: number
 *                   totalIncome:
 *                     type: number
 *                   totalExpense:
 *                     type: number
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const funds = await getFunds();
    return NextResponse.json(funds);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
