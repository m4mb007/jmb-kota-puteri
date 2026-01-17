import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const session = await auth();
  
  // Protect this page: Only Management roles
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    redirect('/dashboard'); 
  }

  const logs = await prisma.auditLog.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Audit Log Sistem</h1>

      <Card>
        <CardHeader>
          <CardTitle>Aktiviti Terkini</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tindakan</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Perincian</TableHead>
                <TableHead>Tarikh & Masa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    Tiada rekod audit.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">{log.user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.createdAt).toLocaleString('ms-MY')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
