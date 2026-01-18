import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { ResidentDashboard } from '@/components/dashboard/resident-dashboard';

export const dynamic = 'force-dynamic';

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
        activeAGMsCount,
        recentAuditLogs,
        complaintStatusStats,
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
          prisma.aGM.count({
            where: { status: 'ACTIVE' },
          }),
          prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
          }),
          prisma.complaint.groupBy({
            by: ['status'],
            _count: { _all: true },
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
          activeAGMsCount={activeAGMsCount}
          recentAuditLogs={recentAuditLogs}
          complaintStatusStats={complaintStatusStats.map(s => ({ status: s.status, count: s._count._all }))}
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
        include: {
          parkings: true,
        }
      });

      const unitIds = units.map((u: any) => u.id as string);

      const manualArrearsTotal = units.reduce(
        (sum: number, unit: any) => sum + (unit.manualArrearsAmount || 0),
        0
      );

      const [pendingBills, notices, activeAGMs, userData] = await Promise.all([
        prisma.bill.findMany({
          where: {
            unitId: { in: unitIds },
            status: 'PENDING'
          }
        }),
        prisma.notice.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.aGM.findMany({
          where: {
            status: { in: ['ACTIVE', 'DRAFT'] },
            meetingDate: { gte: new Date() }
          },
          orderBy: { meetingDate: 'asc' },
          take: 3
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            votingEligibilityOverride: true,
            votingEligibilityReason: true,
          }
        })
      ]);

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

      // Check voting eligibility: eligible if no arrears across all units OR override is true
      const hasArrears = unitsWithArrears.some(u => u._arrearsTotal > 0);
      let isEligibleToVote = !hasArrears;
      if (userData?.votingEligibilityOverride !== null && userData?.votingEligibilityOverride !== undefined) {
        isEligibleToVote = userData.votingEligibilityOverride;
      }

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
          activeAGMs={activeAGMs}
          isEligibleToVote={isEligibleToVote}
          votingEligibilityReason={userData?.votingEligibilityReason}
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
