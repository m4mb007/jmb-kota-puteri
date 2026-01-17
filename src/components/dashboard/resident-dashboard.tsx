import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, FileText, Megaphone, ArrowRight, CalendarRange, Clock, CreditCard, BellRing, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Selamat Datang, <span className="text-blue-600">{userName.split(' ')[0]}!</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Status akaun anda aktif dan dikemaskini hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest border-slate-200 hover:bg-slate-50">
              Profil Saya
            </Button>
          </Link>
          <Link href="/dashboard/complaints/create">
            <Button className="rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
              Hantar Aduan
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Unit Info Card */}
        <Card className="border-none shadow-sm overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Unit Kediaman Saya</CardTitle>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Senarai unit didaftarkan</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Home className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{units.length}</div>
            <div className="mt-6 space-y-3">
              {units.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Tiada unit dikesan</p>
                </div>
              ) : (
                units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/dashboard/units/${unit.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-white hover:shadow-md hover:scale-[1.02] rounded-2xl border border-slate-100 transition-all duration-200 group/unit"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-600 group-hover/unit:bg-blue-600 group-hover/unit:text-white transition-colors">
                        {unit.unitNumber.slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{unit.unitNumber}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {unit.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {unit._arrearsTotal && unit._arrearsTotal > 0 ? (
                        <div className="bg-rose-50 px-2 py-1 rounded-lg">
                          <div className="text-[10px] font-black text-rose-600">
                            RM {Number(unit._arrearsTotal).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Tiada Tunggakan</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Card */}
        <Card className={cn(
          "border-none shadow-sm overflow-hidden",
          totalPending > 0 ? "bg-white shadow-rose-100" : "bg-white"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status Bayaran</CardTitle>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Bil dan tunggakan aktif</p>
            </div>
            <div className={cn(
              "p-2 rounded-xl",
              totalPending > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
            )}>
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-3xl font-black",
              totalPending > 0 ? "text-rose-600" : "text-emerald-500"
            )}>
              RM {totalPending.toFixed(2)}
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Jumlah Perlu Dijelaskan</p>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{pendingBillsCount} Bil Belum Bayar</span>
              </div>
              
              <Link href="/dashboard/billing">
                <Button 
                  className={cn(
                    "w-full rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]",
                    totalPending > 0 
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" 
                      : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  )}
                >
                  {totalPending > 0 ? "Jelaskan Sekarang" : "Lihat Rekod Bayaran"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              
              {totalPending > 0 && (
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                    Pilihan pelan ansuran disediakan. Sila rujuk pengurusan untuk maklumat lanjut.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activities Card */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aktiviti Komuniti</CardTitle>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Majlis & program akan datang</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarRange className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* My Activities */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Aktiviti Saya
                </h4>
                {ownActivities.length === 0 ? (
                  <p className="text-xs font-bold text-slate-300 italic ml-3">Tiada permohonan aktif</p>
                ) : (
                  <div className="space-y-3">
                    {ownActivities.slice(0, 2).map((activity) => (
                      <div key={activity.id} className="flex gap-3 group/act">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100 group-hover/act:border-blue-200 group-hover/act:bg-blue-50 transition-colors">
                          <span className="text-[10px] font-black text-slate-400 group-hover/act:text-blue-500">{new Date(activity.date).getDate()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase group-hover/act:text-blue-500">{new Date(activity.date).toLocaleDateString('ms-MY', { month: 'short' })}</span>
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate group-hover/act:text-blue-600 transition-colors">{activity.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {activity.location || 'Lokasi Terhad'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Activities */}
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-500" />
                  Program Komuniti
                </h4>
                {communityActivities.length === 0 ? (
                  <p className="text-xs font-bold text-slate-300 italic ml-3">Tiada program dijadualkan</p>
                ) : (
                  <div className="space-y-3">
                    {communityActivities.slice(0, 2).map((activity) => (
                      <div key={activity.id} className="flex gap-3 group/act">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100 group-hover/act:border-amber-200 group-hover/act:bg-amber-50 transition-colors">
                          <span className="text-[10px] font-black text-slate-400 group-hover/act:text-amber-600">{new Date(activity.date).getDate()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase group-hover/act:text-amber-600">{new Date(activity.date).toLocaleDateString('ms-MY', { month: 'short' })}</span>
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate group-hover/act:text-amber-700 transition-colors">{activity.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {activity.location || 'Kawasan JMB'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Link href="/dashboard/activities" className="flex items-center justify-center w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors">
                Lihat Semua Aktiviti
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notices & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Notices Section */}
        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg font-bold">Papan Notis Terkini</CardTitle>
              </div>
              <Link href="/dashboard/notices" className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                Semua Notis
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {notices.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Tiada notis baru untuk dipaparkan</p>
                  </div>
                ) : (
                  notices.slice(0, 4).map((notice) => (
                    <Link
                      key={notice.id}
                      href={`/dashboard/notices/${notice.id}`}
                      className="flex flex-col p-5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">{notice.title}</h4>
                        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {new Date(notice.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {notice.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info / Tips Side Card */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-3xl p-6 text-white h-full relative overflow-hidden shadow-xl shadow-slate-200">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="p-2 rounded-xl bg-white/10 w-fit mb-6 backdrop-blur-sm">
                <Megaphone className="w-5 h-5 text-blue-400" />
              </div>
              
              <h3 className="text-lg font-black leading-tight mb-4 uppercase tracking-tight">Info & Tips Kediaman</h3>
              
              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Keselamatan</p>
                  <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                    Pastikan kad akses sentiasa dibawa dan tidak dipinjamkan kepada orang luar.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Keceriaan</p>
                  <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                    Jangan letakkan sampah di luar unit atau di kawasan laluan kecemasan.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kecemasan</p>
                <p className="text-sm font-black text-white">012-XXXXXXX</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Bilik Kawalan Keselamatan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
