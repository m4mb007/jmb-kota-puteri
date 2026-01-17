import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, FileText, Megaphone, ArrowRight, CalendarRange } from 'lucide-react';

interface ResidentDashboardProps {
  units: any[];
  pendingBills: any[];
  notices: any[];
  userName: string;
  manualArrearsTotal: number;
  ownActivities: any[];
  communityActivities: any[];
}

export function ResidentDashboard({
  units,
  pendingBills,
  notices,
  userName,
  manualArrearsTotal,
  ownActivities,
  communityActivities,
}: ResidentDashboardProps) {
  const systemPending = pendingBills.reduce(
    (acc, bill) => acc + Number(bill.amount || 0),
    0
  );
  const totalPending = systemPending + (manualArrearsTotal || 0);
  const pendingBillsCount = pendingBills.length;
  const upcomingActivitiesCount = ownActivities.length + communityActivities.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {userName}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Anda mempunyai <span className="font-semibold">{units.length}</span> unit
            dan <span className="font-semibold">{pendingBillsCount}</span> bil belum jelas
            (RM {totalPending.toFixed(2)}), serta <span className="font-semibold">{upcomingActivitiesCount}</span> aktiviti akan datang.
            {totalPending > 0 && (
              <span className="block mt-1 text-xs text-blue-600">
                Lihat pilihan pelan ansuran di halaman Profil Saya.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit Saya</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
            <p className="text-xs text-muted-foreground">
              Unit didiami / dimiliki
            </p>
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {units.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Tiada unit didaftarkan di bawah akaun ini lagi.
                </p>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded border"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{unit.unitNumber}</span>
                      <span className="text-[11px] text-slate-500">
                        {unit.type}
                      </span>
                    </div>
                    <div className="text-right">
                      {unit._arrearsTotal && unit._arrearsTotal > 0 ? (
                        <>
                          <div className="text-xs font-semibold text-red-600">
                            RM {Number(unit._arrearsTotal).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-red-500">
                            {unit._arrearsBillCount || 0} bil PENDING
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-slate-500">
                          Tiada tunggakan
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bil Belum Jelas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">RM {totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah perlu dibayar
            </p>
            <div className="mt-4">
              <Link href="/dashboard/billing">
                <Button size="sm" className="w-full" variant={totalPending > 0 ? "destructive" : "outline"}>
                  {totalPending > 0 ? "Bayar Sekarang" : "Lihat Rekod Bayaran"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiviti / Majlis Akan Datang</CardTitle>
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              <div className="text-xs font-semibold text-slate-600">
                Aktiviti Saya
              </div>
              {ownActivities.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Tiada aktiviti peribadi terjadual.</p>
              ) : (
                ownActivities.slice(0, 2).map((activity) => (
                  <div key={activity.id} className="border-b pb-2 last:border-0 last:pb-0">
                    <p className="font-medium text-sm line-clamp-1">{activity.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(activity.date).toLocaleDateString('ms-MY')} • {activity.location || 'Lokasi akan dimaklumkan'}
                    </p>
                  </div>
                ))
              )}

              <div className="text-xs font-semibold text-slate-600 pt-2">
                Aktiviti Komuniti
              </div>
              {communityActivities.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Tiada aktiviti komuniti terjadual.</p>
              ) : (
                communityActivities.slice(0, 2).map((activity) => (
                  <div key={activity.id} className="border-b pb-2 last:border-0 last:pb-0">
                    <p className="font-medium text-sm line-clamp-1">{activity.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(activity.date).toLocaleDateString('ms-MY')} • {activity.location || 'Lokasi akan dimaklumkan'}
                    </p>
                  </div>
                ))
              )}
              <Link href="/dashboard/activities" className="flex items-center text-xs text-blue-600 hover:underline mt-2">
                Lihat semua aktiviti <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notis Terkini</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {notices.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Tiada notis terkini.</p>
              ) : (
                notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="border-b pb-2 last:border-0 last:pb-0">
                    <p className="font-medium text-sm line-clamp-1">{notice.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notice.createdAt).toLocaleDateString('ms-MY')}
                    </p>
                  </div>
                ))
              )}
              <Link href="/dashboard/notices" className="flex items-center text-xs text-blue-600 hover:underline mt-2">
                Lihat semua notis <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
