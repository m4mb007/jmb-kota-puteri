import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, AlertCircle } from 'lucide-react';
import { updateComplaintStatus } from '@/lib/actions/complaints';
import { ComplaintStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ComplaintsPage() {
  const complaints = await prisma.complaint.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pengurusan Aduan</h1>
        <Link href="/dashboard/complaints/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Cipta Aduan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senarai Aduan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tajuk</TableHead>
                <TableHead>Pengadu</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Tiada aduan direkodkan.
                  </TableCell>
                </TableRow>
              ) : (
                complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{complaint.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {complaint.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{complaint.user.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {complaint.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(complaint.createdAt).toLocaleDateString('ms-MY')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {complaint.status === 'OPEN' && (
                          <form action={updateComplaintStatus.bind(null, complaint.id, 'IN_PROGRESS')}>
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                              Mula Proses
                            </Button>
                          </form>
                        )}
                        {complaint.status === 'IN_PROGRESS' && (
                          <form action={updateComplaintStatus.bind(null, complaint.id, 'CLOSED')}>
                            <Button size="sm" variant="default" className="h-8 text-xs bg-green-600 hover:bg-green-700">
                              Selesai
                            </Button>
                          </form>
                        )}
                         {complaint.status === 'CLOSED' && (
                          <span className="text-xs text-muted-foreground">Selesai</span>
                        )}
                      </div>
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

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const styles = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-green-100 text-green-800',
  };

  const labels = {
    OPEN: 'Baru',
    IN_PROGRESS: 'Sedang Diproses',
    CLOSED: 'Selesai',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
