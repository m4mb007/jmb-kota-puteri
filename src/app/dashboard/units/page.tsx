import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { UserProfileModal } from '@/components/users/user-profile-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function UnitsPage() {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const canCreate = ['SUPER_ADMIN', 'JMB'].includes(session.user.role);

  const units = await prisma.unit.findMany({
    where: {
      isActive: true,
    },
    include: {
      lot: true,
      owner: true,
      tenant: true,
      parkings: true,
    },
    orderBy: {
      unitNumber: 'asc',
    },
  });

  const unitIds = units.map((unit) => unit.id as string);

  const pendingByUnit = unitIds.length
    ? await prisma.bill.groupBy({
        by: ['unitId'],
        where: {
          unitId: { in: unitIds },
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const arrearsMap = new Map(
    pendingByUnit.map((item) => [
      item.unitId,
      {
        total: item._sum.amount || 0,
        count: item._count._all,
      },
    ])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pengurusan Unit</h1>
        {canCreate && (
          <Link href="/dashboard/units/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Unit
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senarai Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombor Unit</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Parking</TableHead>
                <TableHead>Pemilik</TableHead>
                <TableHead>Tarikh SNP</TableHead>
                <TableHead>Penyewa</TableHead>
                <TableHead>Tunggakan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/units/${unit.id}`} className="hover:underline text-blue-600">
                      {unit.unitNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{unit.type}</TableCell>
                  <TableCell>{unit.lot.lotNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {unit.parkings.map((p) => (
                        <span key={p.id} className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border">
                          {p.number}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {unit.owner ? (
                      <UserProfileModal 
                        userId={unit.owner.id} 
                        name={unit.owner.name} 
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {unit.owner?.snpDate ? new Date(unit.owner.snpDate).toLocaleDateString('ms-MY') : '-'}
                  </TableCell>
                  <TableCell>
                    {unit.tenant ? (
                      <UserProfileModal 
                        userId={unit.tenant.id} 
                        name={unit.tenant.name} 
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const arrears = (arrearsMap.get(unit.id as string) || { total: 0, count: 0 }) as { total: number; count: number };
                      const manualArrears = unit.manualArrearsAmount || 0;
                      const totalArrears = arrears.total + manualArrears;
                      if (totalArrears <= 0) {
                        return (
                          <span className="text-xs text-slate-500">
                            Tiada tunggakan
                          </span>
                        );
                      }
                      return (
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-red-600">
                            RM {totalArrears.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tunggakan lama: RM {manualArrears.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Bil semasa: RM {arrears.total.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-red-500">
                            {arrears.count} bil belum jelas
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {unit.owner || unit.tenant ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Diduduki
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        Kosong
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                    Tiada unit dijumpai.
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
