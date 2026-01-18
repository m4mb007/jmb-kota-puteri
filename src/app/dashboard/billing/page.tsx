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
import { Plus } from 'lucide-react';
import { BillActions } from './bill-actions';
import { MonthlyReportButton } from './monthly-report-button';
import { BulkBillingButton } from './bulk-billing-button';

export const dynamic = 'force-dynamic';

interface BillingSearchParams {
  status?: string;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<BillingSearchParams>;
}) {
  const session = await auth();
  const user = session?.user;
  const userRole = user?.role || 'OWNER';
  const userId = user?.id;

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(userRole);
  const params = await searchParams;
  const statusFilter = params?.status;

  const whereClause: {
    status?: string;
    unit?: {
      OR: { ownerId?: string; tenantId?: string }[];
    };
  } = {};

  if (statusFilter === 'PENDING') {
    whereClause.status = 'PENDING';
  }

  if (!isManagement) {
    whereClause.unit = {
      OR: [
        { ownerId: userId },
        { tenantId: userId },
      ],
    };
  }

  const bills = await prisma.bill.findMany({
    where: whereClause as any,
    include: {
      unit: {
        include: {
          owner: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pengurusan Bil</h1>
        {['SUPER_ADMIN', 'JMB', 'STAFF'].includes(userRole) && (
          <div className="flex gap-2">
            <BulkBillingButton />
            <MonthlyReportButton bills={bills} />
            <Link href="/dashboard/billing/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Cipta Bil
              </Button>
            </Link>
          </div>
        )}
      </div>

      {statusFilter === 'PENDING' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>Penapis aktif: hanya bil dengan status BELUM BAYAR (PENDING) dipaparkan.</span>
          <Link
            href="/dashboard/billing"
            className="ml-2 font-semibold underline"
          >
            Buang penapis
          </Link>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Senarai Bil</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/dashboard/billing">
              <Button
                variant={statusFilter === 'PENDING' ? 'outline' : 'default'}
                size="sm"
              >
                Semua Bil
              </Button>
            </Link>
            <Link href="/dashboard/billing?status=PENDING">
              <Button
                variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                size="sm"
              >
                Bil PENDING
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Bulan/Tahun</TableHead>
                <TableHead>Jumlah (RM)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dicipta Pada</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill: {
                id: string;
                unit: { unitNumber: string; owner?: any };
                month: number;
                year: number;
                amount: number;
                status: string;
                receiptUrl?: string | null;
                createdAt: Date;
              }) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.unit.unitNumber}</TableCell>
                  <TableCell>{bill.month}/{bill.year}</TableCell>
                  <TableCell>RM {bill.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bill.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        bill.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        bill.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bill.status === 'APPROVED' ? 'DIBAYAR' :
                         bill.status === 'PAID' ? 'MENUNGGU PENGESAHAN' :
                         bill.status === 'REJECTED' ? 'DITOLAK' : 'BELUM BAYAR'}
                      </span>
                      {bill.receiptUrl && (
                        <span className="inline-flex items-center text-xs text-slate-500" title="Resit tersedia">
                          📎
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{bill.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <BillActions 
                      bill={bill}
                      userRole={userRole}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                    Tiada bil dijumpai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
