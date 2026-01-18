import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, User as UserIcon, Building2 } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profil Pengguna',
};

function calculateInstallmentPlans(total: number) {
  if (!total || total <= 0) return [];

  const extras = [20, 30, 40, 50];
  const today = new Date();

  return extras.map((extra) => {
    const months = Math.ceil(total / extra);
    const endDate = new Date(today.getTime());
    endDate.setMonth(endDate.getMonth() + months);

    return {
      extra,
      months,
      endDate,
    };
  });
}

async function getAverageBillAmount() {
  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT "key", "value"
      FROM "SystemSetting"
      WHERE "key" IN ('BASE_MONTHLY_BILL_ATAS', 'BASE_MONTHLY_BILL_BAWAH')
    `;

    let atas = 95;
    let bawah = 88;

    for (const row of rows) {
      const parsed = parseFloat(row.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        if (row.key === 'BASE_MONTHLY_BILL_ATAS') {
          atas = parsed;
        } else if (row.key === 'BASE_MONTHLY_BILL_BAWAH') {
          bawah = parsed;
        }
      }
    }

    return (atas + bawah) / 2;
  } catch (error) {
    return 91.5; // Average of 95 and 88
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      ownedUnits: {
        include: {
          lot: true,
        },
      },
      rentedUnits: {
        include: {
          lot: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const arrears = await prisma.bill.aggregate({
    where: {
      status: 'PENDING',
      unit: {
        OR: [
          { ownerId: id },
          { tenantId: id },
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
        { ownerId: id },
        { tenantId: id },
      ],
    },
    select: {
      manualArrearsAmount: true,
    },
  });

  const manualArrearsTotal = units.reduce(
    (sum: number, u: { manualArrearsAmount: number }) => sum + (u.manualArrearsAmount || 0),
    0
  );

  const systemArrearsAmount = arrears._sum.amount || 0;
  const totalArrearsAmount = systemArrearsAmount + manualArrearsTotal;
  const avgBillAmount = await getAverageBillAmount();
  const installmentPlans = calculateInstallmentPlans(totalArrearsAmount);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/units">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil Pengguna</h1>
            {totalArrearsAmount > 0 && (
              <div className="mt-1 text-sm text-red-600">
                <p>
                  Tunggakan bil: RM {totalArrearsAmount.toFixed(2)} ({arrears._count._all} bil PENDING)
                </p>
                <div className="mt-0.5 text-[11px] text-slate-700 space-y-0.5">
                  <div>Tunggakan lama: RM {manualArrearsTotal.toFixed(2)}</div>
                  <div>Bil semasa: RM {systemArrearsAmount.toFixed(2)}</div>
                </div>
                {installmentPlans.length > 0 && (
                  <div className="mt-2 border-t border-amber-200 pt-2">
                    <div className="text-[11px] font-semibold text-slate-800">
                      Simulasi pelan ansuran tunggakan
                    </div>
                    <div className="mt-1 text-[11px] text-slate-700">
                      Jika pemilik bayar tambahan setiap bulan di samping bil biasa RM {avgBillAmount.toFixed(2)}:
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {installmentPlans.map((plan) => (
                        <div
                          key={plan.extra}
                          className="flex items-center justify-between rounded-md border border-blue-100 bg-white/60 px-2 py-1.5 text-[11px]"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              +RM {plan.extra.toFixed(2)} / bulan
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Tambahan di atas bil bulanan RM {avgBillAmount.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-slate-900">
                              ~{plan.months} bulan
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Anggaran selesai:{' '}
                              {plan.endDate.toLocaleDateString('ms-MY')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {session?.user?.role === 'SUPER_ADMIN' && (
          <Link href={`/dashboard/users/${user.id}/edit`}>
            <Button>Kemaskini Pengguna</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Maklumat Peribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Nama Penuh
                </div>
                <div className="text-lg font-semibold">{user.name}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Emel
                </div>
                <div>{user.email}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefon
                </div>
                <div>{user.phone || '-'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Peranan</div>
                <div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Unit Dimiliki ({user.ownedUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.ownedUnits.length > 0 ? (
              <ul className="space-y-2">
                {user.ownedUnits.map((unit: any) => (
                  <li key={unit.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                    <div>
                      <div className="font-medium">{unit.unitNumber}</div>
                      <div className="text-xs text-muted-foreground">Lot {unit.lot.lotNumber}</div>
                    </div>
                    <Link href={`/dashboard/units/${unit.id}`}>
                      <Button variant="outline" size="sm">Lihat</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Tiada unit dimiliki.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Unit Disewa ({user.rentedUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.rentedUnits.length > 0 ? (
              <ul className="space-y-2">
                {user.rentedUnits.map((unit: any) => (
                  <li key={unit.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                    <div>
                      <div className="font-medium">{unit.unitNumber}</div>
                      <div className="text-xs text-muted-foreground">Lot {unit.lot.lotNumber}</div>
                    </div>
                    <Link href={`/dashboard/units/${unit.id}`}>
                      <Button variant="outline" size="sm">Lihat</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Tiada unit disewa.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
