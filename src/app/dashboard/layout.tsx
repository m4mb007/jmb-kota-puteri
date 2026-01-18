import { Sidebar } from '@/components/layout/sidebar';
import { SearchBar } from '@/components/layout/search-bar';
import { NotificationBell } from '@/components/layout/notification-bell';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 max-w-md w-full">
              <SearchBar />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell />
            
            <div className="h-8 w-px bg-slate-200 hidden md:block" />
            
            <div className="flex items-center gap-3 ml-2">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Sistem</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
