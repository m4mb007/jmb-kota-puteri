import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(userRole);

    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: 'notice' | 'activity' | 'bill' | 'complaint';
      isRead: boolean;
      createdAt: string;
      link?: string;
    }> = [];

    // Get user units once for residents (used for both notices and bills)
    let userUnits: Array<{ id: string; type: string }> = [];
    if (!isManagement) {
      userUnits = await prisma.unit.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { tenantId: userId },
          ],
        },
        select: { id: true, type: true },
      });
    }

    // Get recent notices
    let noticeWhere: any = {};
    
    if (isManagement) {
      // Management sees all notices
      noticeWhere = {};
    } else {
      // Residents see notices for ALL, plus their unit type if applicable
      const unitTypes = [...new Set(userUnits.map(u => u.type))];
      const targets: any[] = [{ target: 'ALL' }];
      
      if (unitTypes.includes('ATAS')) {
        targets.push({ target: 'ATAS_ONLY' });
      }
      if (unitTypes.includes('BAWAH')) {
        targets.push({ target: 'BAWAH_ONLY' });
      }
      
      noticeWhere = { OR: targets };
    }
    
    const notices = await prisma.notice.findMany({
      where: noticeWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    notices.forEach(notice => {
      notifications.push({
        id: `notice-${notice.id}`,
        title: notice.title,
        message: notice.content.substring(0, 100),
        type: 'notice',
        isRead: false, // TODO: Implement read tracking
        createdAt: notice.createdAt.toISOString(),
        link: '/dashboard/notices',
      });
    });

    if (isManagement) {
      // Pending activity requests
      const pendingActivities = await prisma.activityRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          createdBy: true,
        },
      });

      pendingActivities.forEach(activity => {
        notifications.push({
          id: `activity-${activity.id}`,
          title: 'Permohonan Aktiviti Baharu',
          message: `${activity.createdBy.name} telah memohon: ${activity.title}`,
          type: 'activity',
          isRead: false,
          createdAt: activity.createdAt.toISOString(),
          link: '/dashboard/activities',
        });
      });

      // Open complaints
      const pendingComplaints = await prisma.complaint.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          reportedBy: true,
        },
      });

      pendingComplaints.forEach(complaint => {
        notifications.push({
          id: `complaint-${complaint.id}`,
          title: 'Aduan Baharu',
          message: `${complaint.reportedBy.name}: ${complaint.description.substring(0, 50)}...`,
          type: 'complaint',
          isRead: false,
          createdAt: complaint.createdAt.toISOString(),
          link: '/dashboard/complaints',
        });
      });
    } else {
      // For residents: pending bills (using userUnits fetched earlier)
      const unitIds = userUnits.map(u => u.id);

      if (unitIds.length > 0) {
        const pendingBills = await prisma.bill.findMany({
          where: {
            unitId: { in: unitIds },
            status: 'PENDING',
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            unit: true,
          },
        });

        pendingBills.forEach(bill => {
          notifications.push({
            id: `bill-${bill.id}`,
            title: 'Invois Tertunggak',
            message: `Unit ${bill.unit.unitNumber}: RM${bill.amount} - ${bill.month}/${bill.year}`,
            type: 'bill',
            isRead: false,
            createdAt: bill.createdAt.toISOString(),
            link: '/dashboard/billing',
          });
        });
      }

      // Activity request status updates
      const recentActivities = await prisma.activityRequest.findMany({
        where: {
          createdById: userId,
          status: { in: ['APPROVED', 'REJECTED'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      });

      recentActivities.forEach(activity => {
        const isApproved = activity.status === 'APPROVED';
        notifications.push({
          id: `activity-${activity.id}`,
          title: `Permohonan ${isApproved ? 'Diluluskan' : 'Ditolak'}`,
          message: `Permohonan aktiviti "${activity.title}" telah ${isApproved ? 'diluluskan' : 'ditolak'}`,
          type: 'activity',
          isRead: false,
          createdAt: activity.updatedAt.toISOString(),
          link: '/dashboard/activities',
        });
      });
    }

    // Sort by date
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ 
      notifications: notifications.slice(0, 10) 
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Ralat semasa mengambil notifikasi' },
      { status: 500 }
    );
  }
}

