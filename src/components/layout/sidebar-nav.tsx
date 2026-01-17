'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Banknote,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  Users2,
  CalendarRange,
} from 'lucide-react';

interface SidebarNavProps {
  role?: string;
  hasArrears?: boolean;
  hasPendingActivities?: boolean;
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Kewangan',
    href: '/dashboard/finance',
    icon: Banknote,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF'],
  },
  {
    title: 'Pengurusan Unit',
    href: '/dashboard/units',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF'],
  },
  {
    title: 'Pengguna',
    href: '/dashboard/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF'],
  },
  {
    title: 'AJK & Komuniti',
    href: '/dashboard/committee',
    icon: Users2,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Pengurusan Bil',
    href: '/dashboard/billing',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Aduan',
    href: '/dashboard/complaints',
    icon: AlertCircle,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Aktiviti / Majlis',
    href: '/dashboard/activities',
    icon: CalendarRange,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Papan Notis',
    href: '/dashboard/notices',
    icon: Megaphone,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
  {
    title: 'Audit Log',
    href: '/dashboard/audit-logs',
    icon: ClipboardList,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF'],
  },
  {
    title: 'Tetapan',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
  },
];

export function SidebarNav({
  role = 'OWNER',
  hasArrears = false,
  hasPendingActivities = false,
}: SidebarNavProps) {
  const pathname = usePathname();
  
  const filteredNavItems = navItems.filter((item) => 
    item.roles.includes(role)
  );

  return (
    <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {filteredNavItems.map((item, index) => {
        const isActive = pathname === item.href;
        const isResident = role === 'OWNER' || role === 'TENANT';
        const showArrearsBadge = isResident && hasArrears && item.href === '/dashboard/billing';
        const isManagement = role === 'SUPER_ADMIN' || role === 'JMB' || role === 'STAFF';
        const showActivitiesBadge =
          isManagement && hasPendingActivities && item.href === '/dashboard/activities';
        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
            {showArrearsBadge && (
              <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
            )}
            {showActivitiesBadge && !showArrearsBadge && (
              <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
