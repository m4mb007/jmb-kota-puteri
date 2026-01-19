import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Megaphone } from 'lucide-react';
import { NoticeTarget } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Papan Notis',
};

export default async function NoticesPage() {
  const session = await auth();
  const notices = await prisma.notice.findMany({
    include: {
      createdBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Papan Notis</h1>
        {['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session?.user?.role || '') && (
          <Link href="/dashboard/notices/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Cipta Notis
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notices.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Tiada notis terkini.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight">{notice.title}</CardTitle>
                  <TargetBadge target={notice.target} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(notice.createdAt).toLocaleDateString('ms-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {' • '}
                  Oleh {notice.createdBy.name}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-4">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function TargetBadge({ target }: { target: NoticeTarget }) {
  const labels: Record<NoticeTarget, string> = {
    ALL: 'Semua',
    ATAS_ONLY: 'Unit Atas',
    BAWAH_ONLY: 'Unit Bawah',
  };

  const styles: Record<NoticeTarget, string> = {
    ALL: 'bg-blue-100 text-blue-800',
    ATAS_ONLY: 'bg-purple-100 text-purple-800',
    BAWAH_ONLY: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
        styles[target] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[target] || target}
    </span>
  );
}
