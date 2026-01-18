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
  Vote,
  User,
} from 'lucide-react';

interface SidebarNavProps {
  role?: string;
  hasArrears?: boolean;
  hasPendingActivities?: boolean;
}

const navGroups = [
  {
    label: 'Utama',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
      {
        title: 'Profil Saya',
        href: '/dashboard/profile',
        icon: User,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
      {
        title: 'Papan Notis',
        href: '/dashboard/notices',
        icon: Megaphone,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
    ]
  },
  {
    label: 'Pengurusan',
    items: [
      {
        title: 'Kewangan',
        href: '/dashboard/finance',
        icon: Banknote,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF'],
      },
      {
        title: 'Unit Kediaman',
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
    ]
  },
  {
    label: 'Residen',
    items: [
      {
        title: 'Bil & Bayaran',
        href: '/dashboard/billing',
        icon: FileText,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
      {
        title: 'Aduan Penduduk',
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
        title: 'AJK & Komuniti',
        href: '/dashboard/committee',
        icon: Users2,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
      {
        title: 'AGM & Undi',
        href: '/dashboard/agm',
        icon: Vote,
        roles: ['SUPER_ADMIN', 'JMB', 'STAFF', 'OWNER', 'TENANT'],
      },
    ]
  },
  {
    label: 'Sistem',
    items: [
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
    ]
  }
];

export function SidebarNav({
  role = 'OWNER',
  hasArrears = false,
  hasPendingActivities = false,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isManagement = role === 'SUPER_ADMIN' || role === 'JMB' || role === 'STAFF';

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group, groupIdx) => {
        const filteredItems = group.items.filter((item) => 
          item.roles.includes(role)
        );

        if (filteredItems.length === 0) return null;

        return (
          <div key={groupIdx} className="flex flex-col gap-1.5">
            <h3 className={cn(
              "px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400",
              isManagement && "text-slate-500"
            )}>
              {group.label}
            </h3>
            <div className="flex flex-col gap-0.5">
              {filteredItems.map((item, itemIdx) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const isResident = role === 'OWNER' || role === 'TENANT';
                const showArrearsBadge = isResident && hasArrears && item.href === '/dashboard/billing';
                const showActivitiesBadge = isManagement && hasPendingActivities && item.href === '/dashboard/activities';
                
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group relative',
                      isActive
                        ? isManagement 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : isManagement
                          ? 'text-slate-400 hover:text-white hover:bg-white/5'
                          : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <item.icon className={cn(
                      "h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-white" : "opacity-70"
                    )} />
                    <span className="flex-1 truncate">{item.title}</span>
                    
                    {showArrearsBadge && (
                      <span className="flex h-2 w-2 rounded-full bg-rose-500 ring-4 ring-white" />
                    )}
                    {showActivitiesBadge && !showArrearsBadge && (
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                    )}

                    {isActive && (
                      <div className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/40",
                        !isManagement && "bg-blue-400"
                      )} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
