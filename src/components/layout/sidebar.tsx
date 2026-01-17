import { auth, signOut } from '@/auth';
import { SidebarNav } from './sidebar-nav';
import { LogOut, User } from 'lucide-react';
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
      <div className={cn(
        "flex flex-col h-full border-r w-64 transition-colors duration-300",
        // Use semantic sidebar variables. 
        // If isManagement is true, we add 'dark' class to scope variables, 
        // but we also need to apply the bg/text classes that use those variables.
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        isManagement && "dark"
      )}>
        <div className="h-14 flex items-center border-b border-sidebar-border px-6">
          <h1 className="font-bold text-lg tracking-tight">JMB Idaman Kota Puteri</h1>
        </div>
      
        <div className="flex-1 py-4">
          <SidebarNav
            role={role}
            hasArrears={hasArrears}
            hasPendingActivities={hasPendingActivities}
          />
        </div>

        <div className="border-t border-sidebar-border p-4">
          <Link href="/dashboard/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-sidebar-accent/10 rounded-lg py-2 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground">
              <User className="h-4 w-4 opacity-60" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {session?.user?.role || 'Role'}
              </span>
            </div>
          </Link>
          
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Sidebar Error:', error);
    return (
      <div className="w-64 border-r bg-red-50 p-4">
        <p className="text-red-500 text-sm">Error loading sidebar</p>
      </div>
    );
  }
}
