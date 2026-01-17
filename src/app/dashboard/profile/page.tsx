
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/users/profile-form';
import Link from 'next/link';

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

async function getBaseBillAmount() {
  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT "value"
      FROM "SystemSetting"
      WHERE "key" = 'BASE_MONTHLY_BILL'
      LIMIT 1
    `;

    const raw = rows[0]?.value;
    const parsed = raw ? parseFloat(raw) : NaN;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 88;
    }

    return parsed;
  } catch (error) {
    return 88;
  }
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  const arrears = await prisma.bill.aggregate({
    where: {
      status: 'PENDING',
      unit: {
        OR: [
          { ownerId: session.user.id },
          { tenantId: session.user.id },
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
        { ownerId: session.user.id },
        { tenantId: session.user.id },
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
  const baseBillAmount = await getBaseBillAmount();
  const installmentPlans = calculateInstallmentPlans(totalArrearsAmount);

  // Serialize user data to plain objects for Client Component
  // This converts Date objects to strings
  const serializedUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profil Saya</CardTitle>
        </CardHeader>
        <CardContent>
          {totalArrearsAmount > 0 && (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <div>
                Anda mempunyai tunggakan bil sebanyak RM {totalArrearsAmount.toFixed(2)} ({arrears._count._all} bil PENDING).
              </div>
              <div className="mt-1 text-xs text-slate-700 space-y-0.5">
                <div>Tunggakan lama: RM {manualArrearsTotal.toFixed(2)}</div>
                <div>Bil semasa: RM {systemArrearsAmount.toFixed(2)}</div>
              </div>
              <div className="mt-1">
                <Link
                  href="/dashboard/billing?status=PENDING"
                  className="font-semibold underline"
                >
                  Lihat senarai bil tertunggak
                </Link>
              </div>
              {installmentPlans.length > 0 && (
                <div className="mt-3 border-t border-amber-200 pt-2">
                  <div className="text-[11px] font-semibold text-slate-800">
                    Simulasi pelan ansuran tunggakan
                  </div>
                  <div className="mt-1 text-[11px] text-slate-700">
                    Jika anda bayar tambahan setiap bulan di samping bil biasa RM {baseBillAmount.toFixed(2)}:
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
                            Tambahan di atas bil bulanan RM 88
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
          <ProfileForm user={serializedUser} />
        </CardContent>
      </Card>
    </div>
  );
}
