import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, AlertCircle, CalendarRange, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  unitCount: number;
  userCount: number;
  lotCount: number;
  unpaidBillsCount: number;
  complaintCount: number;
  totalPendingAmount: number;
  monthlyIncome: number;
  maintenanceBalance: number;
  sinkingBalance: number;
  pendingActivitiesCount: number;
  upcomingApprovedActivitiesCount: number;
  topArrearsUnits: {
    unitId: string;
    unitNumber: string;
    ownerName: string | null;
    total: number;
  }[];
}

export function AdminDashboard({
  unitCount,
  userCount,
  lotCount,
  unpaidBillsCount,
  complaintCount,
  totalPendingAmount,
  monthlyIncome,
  maintenanceBalance,
  sinkingBalance,
  pendingActivitiesCount,
  upcomingApprovedActivitiesCount,
  topArrearsUnits,
}: AdminDashboardProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ringkasan Sistem</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Selamat datang kembali. Berikut adalah status terkini JMB Idaman Kota Puteri.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Live Updates
          </div>
          <div className="px-4 py-2 text-slate-500 text-sm font-semibold">
            {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Jumlah Unit', value: unitCount, sub: `${lotCount} Lot Aktif`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Pengguna', value: userCount, sub: 'Pemilik & Penyewa', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Aduan Aktif', value: complaintCount, sub: 'Perlu tindakan segera', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { title: 'Aktiviti Baru', value: pendingActivitiesCount, sub: `${upcomingApprovedActivitiesCount} akan datang`, icon: CalendarRange, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.title}</h3>
                <div className="text-3xl font-black text-slate-900 mt-1">{stat.value}</div>
                <p className="text-xs font-semibold text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Visual Summary Card */}
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Ringkasan Operasi</CardTitle>
              <select className="text-xs font-bold bg-slate-100 border-none rounded-lg px-2 py-1 outline-none text-slate-500 cursor-pointer">
                <option>Bulan Ini</option>
                <option>Tahun Ini</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-4 bg-slate-50/50 rounded-3xl p-6 border border-slate-100 mt-4">
              {[
                { label: 'Unit', value: unitCount, color: 'from-blue-500 to-blue-600' },
                { label: 'Pengguna', value: userCount, color: 'from-purple-500 to-purple-600' },
                { label: 'Bil Pending', value: unpaidBillsCount, color: 'from-amber-500 to-amber-600' },
                { label: 'Aduan', value: complaintCount, color: 'from-rose-500 to-rose-600' },
                { label: 'Aktiviti', value: pendingActivitiesCount, color: 'from-indigo-500 to-indigo-600' },
              ].map((item, i) => {
                const max = Math.max(unitCount, userCount, unpaidBillsCount, complaintCount, pendingActivitiesCount, 1);
                const height = (item.value / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-3 group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-1">
                      {item.value}
                    </div>
                    <div
                      className={cn("w-full rounded-2xl shadow-sm transition-all duration-500 bg-gradient-to-t group-hover:scale-x-105", item.color)}
                      style={{ height: `${height}%`, minHeight: item.value > 0 ? '8px' : '0px' }}
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate w-full text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white pb-6 pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-lg font-bold">Kewangan JMB</CardTitle>
            </div>
            <p className="text-slate-400 text-xs font-medium">Kutipan dan baki dana semasa</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Kutipan Bulan Ini</div>
                <div className="text-3xl font-black text-blue-700">RM {monthlyIncome.toFixed(2)}</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-sm font-bold text-slate-600">Maintenance Fund</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">RM {maintenanceBalance.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <span className="text-sm font-bold text-slate-600">Sinking Fund</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">RM {sinkingBalance.toFixed(2)}</span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Jumlah Baki Dana</span>
                  <span className="text-lg font-black text-slate-900">RM {(maintenanceBalance + sinkingBalance).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-rose-50 p-4 flex items-center justify-between border-t border-rose-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-700">Tunggakan Belum Kutip</span>
              </div>
              <span className="text-sm font-black text-rose-700">RM {totalPendingAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrears List */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-rose-600">Analisis Tunggakan Tinggi</CardTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Senarai 5 unit dengan tunggakan tertinggi perlu tindakan</p>
          </div>
          <Link href="/dashboard/billing?status=PENDING" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
            Lihat Semua
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Kediaman</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemilik Berdaftar</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Jumlah Tunggakan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topArrearsUnits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm font-bold text-slate-400 bg-slate-50/20 italic">
                      Tiada tunggakan dikesan. Rekod bersih!
                    </td>
                  </tr>
                ) : (
                  topArrearsUnits.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {item.unitNumber.slice(0, 2)}
                          </div>
                          <span className="font-bold text-slate-900">{item.unitNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-600">{item.ownerName || 'Tiada maklumat'}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">
                        RM {item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/units/${item.unitId}`} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">
                          Lihat Profil Unit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
