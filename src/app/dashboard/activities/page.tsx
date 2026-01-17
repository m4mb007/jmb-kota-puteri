import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarRange, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { updateActivityStatus } from '@/lib/actions/activities';
import { ActivitiesExportButton } from './activities-export-button';

export const dynamic = 'force-dynamic';

interface ActivitiesSearchParams {
  status?: string;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<ActivitiesSearchParams>;
}) {
  const session = await auth();
  const user = session?.user;
  const role = user?.role || 'OWNER';
  const userId = user?.id;

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(role);
  const params = await searchParams;
  const statusFilter = params?.status;

  const whereClause: {
    createdById?: string;
    status?: string;
  } = {};

  if (!isManagement && userId) {
    whereClause.createdById = userId;
  }

  if (statusFilter && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(statusFilter)) {
    whereClause.status = statusFilter;
  }

  const activities = await prisma.activityRequest.findMany({
    where: whereClause as any,
    include: {
      createdBy: true,
      unit: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Aktiviti / Majlis</h1>
        {['OWNER', 'TENANT'].includes(role) && (
          <Link href="/dashboard/activities/create">
            <Button>
              <CalendarRange className="mr-2 h-4 w-4" /> Mohon Aktiviti
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Senarai Permohonan Aktiviti</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <Link href="/dashboard/activities">
                  <Button
                    variant={!statusFilter ? 'default' : 'outline'}
                    size="sm"
                  >
                    Semua
                  </Button>
                </Link>
                <Link href="/dashboard/activities?status=PENDING">
                  <Button
                    variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Menunggu
                  </Button>
                </Link>
                <Link href="/dashboard/activities?status=APPROVED">
                  <Button
                    variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Diluluskan
                  </Button>
                </Link>
                <Link href="/dashboard/activities?status=REJECTED">
                  <Button
                    variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Ditolak
                  </Button>
                </Link>
                <Link href="/dashboard/activities?status=CANCELLED">
                  <Button
                    variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
                    size="sm"
                  >
                    Dibatalkan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActivitiesExportButton activities={activities} statusFilter={statusFilter} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tajuk</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Tiada permohonan aktiviti direkodkan.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity: {
                  id: string;
                  title: string;
                  description: string;
                  date: Date;
                  location: string | null;
                  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
                  unit: { unitNumber: string } | null;
                  createdBy: { name: string };
                }) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{activity.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                          {activity.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.date).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell>{activity.location || '-'}</TableCell>
                    <TableCell>{activity.unit?.unitNumber || '-'}</TableCell>
                    <TableCell>{activity.createdBy.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={activity.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {isManagement && activity.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <form
                            action={updateActivityStatus.bind(
                              null,
                              activity.id,
                              'APPROVED'
                            )}
                          >
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs bg-green-600 hover:bg-green-700"
                            >
                              Lulus
                            </Button>
                          </form>
                          <form
                            action={updateActivityStatus.bind(
                              null,
                              activity.id,
                              'REJECTED'
                            )}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Tolak
                            </Button>
                          </form>
                        </div>
                      )}
                      {!isManagement && activity.status === 'PENDING' && (
                        <span className="text-xs text-muted-foreground">
                          Menunggu kelulusan pengurusan
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge(props: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}) {
  const { status } = props;

  let style = 'bg-gray-100 text-gray-800';
  let label: string = status;
  let icon = <Clock className="h-3 w-3 mr-1" />;

  if (status === 'PENDING') {
    style = 'bg-yellow-100 text-yellow-800';
    label = 'Menunggu';
    icon = <Clock className="h-3 w-3 mr-1" />;
  } else if (status === 'APPROVED') {
    style = 'bg-green-100 text-green-800';
    label = 'Diluluskan';
    icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
  } else if (status === 'REJECTED') {
    style = 'bg-red-100 text-red-800';
    label = 'Ditolak';
    icon = <XCircle className="h-3 w-3 mr-1" />;
  } else if (status === 'CANCELLED') {
    style = 'bg-slate-100 text-slate-800';
    label = 'Dibatalkan';
    icon = <XCircle className="h-3 w-3 mr-1" />;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {icon}
      {label}
    </span>
  );
}
