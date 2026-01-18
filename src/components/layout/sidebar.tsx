import { auth, signOut } from '@/auth';
import { SidebarNav } from './sidebar-nav';
import { LogOut, User, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export async function Sidebar() {
  try {
    const session = await auth();
    const role = session?.user?.role || 'OWNER';
    const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(role);
    let hasArrears = false;
    let hasPendingActivities = false;

    if (!isManagement && session?.user?.id) {
      const arrearsCount = await prisma.bill.count({
        where: {
          status: 'PENDING',
          unit: {
            OR: [
              { ownerId: session.user.id },
              { tenantId: session.user.id },
            ],
          },
        },
      });
      hasArrears = arrearsCount > 0;
    }

    if (isManagement) {
      const pendingActivitiesCount = await prisma.activityRequest.count({
        where: {
          status: 'PENDING',
        },
      });
      hasPendingActivities = pendingActivitiesCount > 0;
    }

    return (
      <aside className={cn(
        "flex flex-col h-full border-r w-72 shrink-0 transition-all duration-300",
        "bg-white border-slate-200",
        isManagement && "bg-slate-900 border-slate-800 text-white dark"
      )}>
        {/* Branding Area */}
        <div className="h-16 flex items-center px-6 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className={cn(
              "p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300",
              isManagement && "shadow-none"
            )}>
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-none">JMB IDAMAN</span>
              <span className={cn(
                "text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5",
                isManagement && "text-slate-500"
              )}>KOTA PUTERI</span>
            </div>
          </Link>
        </div>
      
        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
          <SidebarNav
            role={role}
            hasArrears={hasArrears}
            hasPendingActivities={hasPendingActivities}
          />
        </div>

        {/* User Profile Area */}
        <div className={cn(
          "p-4 mt-auto border-t border-slate-100",
          isManagement && "border-slate-800"
        )}>
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-200 border border-transparent",
            "hover:bg-slate-50 hover:border-slate-100",
            isManagement && "hover:bg-white/5 hover:border-white/10"
          )}>
            <Link 
              href="/dashboard/profile"
              className={cn(
                "flex items-center gap-3 mb-4 p-2 -m-2 rounded-xl transition-all duration-200 group",
                "hover:bg-slate-100/50 hover:shadow-sm",
                isManagement && "hover:bg-white/5"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm",
                isManagement && "bg-blue-600/20 text-blue-400"
              )}>
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate leading-none mb-1 group-hover:text-blue-600 transition-colors">
                  {session?.user?.name || 'Pengguna'}
                </span>
                <span className={cn(
                  "text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate",
                  isManagement && "text-slate-500"
                )}>
                  {session?.user?.role || 'Role'}
                </span>
              </div>
            </Link>
            
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
                "bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm shadow-rose-100",
                isManagement && "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 shadow-none"
              )}>
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    );
  } catch (error) {
    console.error('Sidebar Error:', error);
    return (
      <aside className="w-72 border-r bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-full bg-rose-100 text-rose-500 mb-3">
          <User className="h-6 w-6" />
        </div>
        <p className="text-rose-600 text-xs font-bold uppercase tracking-wider">Ralat Memuat Sidebar</p>
      </aside>
    );
  }
}
