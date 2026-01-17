import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, AlertCircle, CalendarRange } from 'lucide-react';
import Link from 'next/link';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">
          Ringkasan pantas status keseluruhan sistem.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jumlah Unit</CardTitle>
            <Building2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitCount}</div>
            <p className="text-xs text-slate-500">
              {lotCount} Lot (Atas/Bawah)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Berdaftar</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-slate-500">
              Pemilik & Penyewa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bil Belum Bayar</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidBillsCount}</div>
            <p className="text-xs text-slate-500">
              Jumlah bil PENDING
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Nilai tertunggak: <span className="font-semibold">RM {totalPendingAmount.toFixed(2)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aduan Aktif</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaintCount}</div>
            <p className="text-xs text-slate-500">
              Perlu tindakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permohonan Aktiviti</CardTitle>
            <CalendarRange className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingActivitiesCount}</div>
            <p className="text-xs text-slate-500">
              Menunggu kelulusan
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Aktiviti akan datang: <span className="font-semibold">{upcomingApprovedActivitiesCount}</span>
            </p>
            <div className="mt-3">
              <Link
                href="/dashboard/activities?status=PENDING"
                className="text-xs text-blue-600 hover:underline"
              >
                Lihat permohonan PENDING
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ringkasan Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-40 flex items-end gap-3 border rounded-md p-3 bg-slate-50">
              {[
                { label: 'Unit', value: unitCount, color: 'bg-blue-500' },
                { label: 'Pengguna', value: userCount, color: 'bg-emerald-500' },
                { label: 'Bil PENDING', value: unpaidBillsCount, color: 'bg-amber-500' },
                { label: 'Aduan', value: complaintCount, color: 'bg-rose-500' },
                { label: 'Aktiviti', value: pendingActivitiesCount, color: 'bg-indigo-500' },
              ].map((item) => {
                const max = Math.max(
                  unitCount,
                  userCount,
                  unpaidBillsCount,
                  complaintCount,
                  pendingActivitiesCount,
                  1
                );
                const height = (item.value / max) * 100;
                return (
                  <div key={item.label} className="flex-1 flex flex-col items-center justify-end gap-2">
                    <div
                      className={`w-full rounded-t-md ${item.color}`}
                      style={{ height: `${height}%`, minHeight: item.value > 0 ? '0.5rem' : '0px' }}
                    />
                    <div className="text-xs text-slate-600 text-center">
                      <div className="font-semibold">{item.value}</div>
                      <div className="mt-0.5">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              Graf bar menunjukkan perbandingan jumlah unit, pengguna, bil belum jelas dan aduan aktif.
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ringkasan Kewangan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Kutipan Bulan Ini
              </div>
              <div className="text-lg font-semibold">
                RM {monthlyIncome.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Baki Dana
              </div>
              <div className="flex items-center justify-between">
                <span>Maintenance Fund</span>
                <span className="font-medium">
                  RM {maintenanceBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sinking Fund</span>
                <span className="font-medium">
                  RM {sinkingBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t mt-2">
                <span>Jumlah Dana</span>
                <span className="font-semibold">
                  RM {(maintenanceBalance + sinkingBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Unit Bertunggakan Tertinggi</CardTitle>
        </CardHeader>
        <CardContent>
          {topArrearsUnits.length === 0 ? (
            <p className="text-sm text-slate-500">
              Tiada unit dengan tunggakan buat masa ini.
            </p>
          ) : (
            <div className="space-y-2">
              {topArrearsUnits.map((item) => (
                <div
                  key={item.unitId}
                  className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      Unit {item.unitNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.ownerName || 'Tiada pemilik berdaftar'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      RM {item.total.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-red-500">
                      Tunggakan
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
