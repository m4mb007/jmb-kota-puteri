import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { ResidentDashboard } from '@/components/dashboard/resident-dashboard';

export default async function DashboardPage() {
  try {
    const session = await auth();
    const user = session?.user;
    const role = user?.role || 'OWNER';
    const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(role);

    if (isManagement) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth();
      const monthStart = new Date(currentYear, currentMonthIndex, 1);
      const monthEnd = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999);

      const [
        unitCount,
        userCount,
        lotCount,
        unpaidBillsCount,
        totalPendingAmount,
        monthlyIncomeAggregate,
        complaintCount,
        pendingActivitiesCount,
      ] =
        await Promise.all([
          prisma.unit.count({
            where: { isActive: true },
          }),
          prisma.user.count({
            where: { isActive: true },
          }),
          prisma.lot.count(),
          prisma.bill.count({
            where: { status: 'PENDING' },
          }),
          prisma.bill.aggregate({
            where: { status: 'PENDING' },
            _sum: { amount: true },
          }),
          prisma.incomeCollection.aggregate({
            where: {
              date: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            _sum: { amount: true },
          }),
          prisma.complaint.count({
            where: { status: 'OPEN' },
          }),
          prisma.activityRequest.count({
            where: { status: 'PENDING' },
          }),
        ]);

      const totalPendingAmountValue = totalPendingAmount._sum.amount || 0;
      const monthlyIncomeValue = monthlyIncomeAggregate._sum.amount || 0;

      const [maintenanceFund, sinkingFund, upcomingApprovedActivitiesCount] = await Promise.all([
        prisma.fund.findUnique({ where: { code: 'MAINTENANCE' } }),
        prisma.fund.findUnique({ where: { code: 'SINKING' } }),
        prisma.activityRequest.count({
          where: {
            status: 'APPROVED',
            date: {
              gte: now,
            },
          },
        }),
      ]);

      let maintenanceBalance = 0;
      let sinkingBalance = 0;

      if (maintenanceFund) {
        const [incomeAgg, expenseAgg] = await Promise.all([
          prisma.incomeCollection.aggregate({
            where: { fundId: maintenanceFund.id },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: {
              fundId: maintenanceFund.id,
              status: 'APPROVED',
            },
            _sum: { amount: true },
          }),
        ]);
        maintenanceBalance =
          (incomeAgg._sum.amount || 0) - (expenseAgg._sum.amount || 0);
      }

      if (sinkingFund) {
        const [incomeAgg, expenseAgg] = await Promise.all([
          prisma.incomeCollection.aggregate({
            where: { fundId: sinkingFund.id },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: {
              fundId: sinkingFund.id,
              status: 'APPROVED',
            },
            _sum: { amount: true },
          }),
        ]);
        sinkingBalance =
          (incomeAgg._sum.amount || 0) - (expenseAgg._sum.amount || 0);
      }

      const arrearsGroup = await prisma.bill.groupBy({
        by: ['unitId'],
        where: {
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      });

      const arrearsUnitIds = arrearsGroup.map((item: { unitId: string }) => item.unitId);

      const arrearsUnits = arrearsUnitIds.length
        ? await prisma.unit.findMany({
            where: {
              id: { in: arrearsUnitIds },
            },
            include: {
              owner: true,
            },
          })
        : [];

      const arrearsUnitsMap = new Map(
        arrearsUnits.map((unit: { id: string }) => [unit.id, unit])
      );

      const topArrearsUnits = arrearsGroup.map(
        (item: { unitId: string; _sum: { amount: number | null } }) => {
          const unit = arrearsUnitsMap.get(item.unitId) as
            | { unitNumber?: string; owner?: { name?: string | null } | null }
            | undefined;
          return {
            unitId: item.unitId,
            unitNumber: unit?.unitNumber || '',
            ownerName: unit?.owner?.name || null,
            total: item._sum.amount || 0,
          };
        }
      );

      return (
        <AdminDashboard
          unitCount={unitCount}
          userCount={userCount}
          lotCount={lotCount}
          unpaidBillsCount={unpaidBillsCount}
          complaintCount={complaintCount}
          totalPendingAmount={totalPendingAmountValue}
          monthlyIncome={monthlyIncomeValue}
          maintenanceBalance={maintenanceBalance}
          sinkingBalance={sinkingBalance}
          pendingActivitiesCount={pendingActivitiesCount}
          upcomingApprovedActivitiesCount={upcomingApprovedActivitiesCount}
          topArrearsUnits={topArrearsUnits}
        />
      );
    } else {
      const userId = user?.id;
      
      const units = await prisma.unit.findMany({
        where: {
          isActive: true,
          OR: [
            { ownerId: userId },
            { tenantId: userId },
          ],
        },
      });

      const unitIds = units.map((u: any) => u.id as string);

      const manualArrearsTotal = units.reduce(
        (sum: number, unit: any) => sum + (unit.manualArrearsAmount || 0),
        0
      );

      const pendingBills = await prisma.bill.findMany({
        where: {
          unitId: { in: unitIds },
          status: 'PENDING'
        }
      });

      const notices = await prisma.notice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });

      const systemByUnit = new Map<string, { total: number; count: number }>();

      for (const bill of pendingBills) {
        const unitIdForBill = bill.unitId as string;
        const current = systemByUnit.get(unitIdForBill) || { total: 0, count: 0 };
        current.total += Number(bill.amount || 0);
        current.count += 1;
        systemByUnit.set(unitIdForBill, current);
      }

      const unitsWithArrears = units.map((unit: any) => {
        const manual = unit.manualArrearsAmount || 0;
        const system = systemByUnit.get(unit.id as string) || { total: 0, count: 0 };
        const total = manual + system.total;

        return {
          ...unit,
          _arrearsManual: manual,
          _arrearsSystem: system.total,
          _arrearsTotal: total,
          _arrearsBillCount: system.count,
        };
      });

      const nowResident = new Date();
      const [ownActivities, communityActivities] = await Promise.all([
        prisma.activityRequest.findMany({
          where: {
            status: 'APPROVED',
            date: {
              gte: nowResident,
            },
            OR: [
              { createdById: userId || '' },
              { unitId: { in: unitIds } },
            ],
          },
          orderBy: {
            date: 'asc',
          },
          take: 5,
        }),
        prisma.activityRequest.findMany({
          where: {
            status: 'APPROVED',
            date: {
              gte: nowResident,
            },
            unitId: null,
          },
          orderBy: {
            date: 'asc',
          },
          take: 5,
        }),
      ]);

      return (
        <ResidentDashboard 
          units={unitsWithArrears}
          pendingBills={pendingBills}
          notices={notices}
          userName={user?.name || 'Resident'}
          manualArrearsTotal={manualArrearsTotal}
          ownActivities={ownActivities}
          communityActivities={communityActivities}
        />
      );
    }

  } catch (error) {
    console.error('Dashboard Error:', error);
    return (
      <div className="p-4 text-red-500">
        <h1 className="text-xl font-bold">Error Loading Dashboard</h1>
        <pre className="mt-2 text-sm bg-slate-100 p-2 rounded">
          {error instanceof Error ? error.message : JSON.stringify(error)}
        </pre>
      </div>
    );
  }
}
