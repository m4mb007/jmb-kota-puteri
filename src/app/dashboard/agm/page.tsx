import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGMActions } from './agm-actions';

export const dynamic = 'force-dynamic';

export default async function AGMPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);

  const agms = await prisma.aGM.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      resolutions: {
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
      },
      _count: {
        select: {
          resolutions: true,
        },
      },
    },
    orderBy: {
      meetingDate: 'desc',
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-500">Draf</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'CLOSED':
        return <Badge className="bg-red-500">Ditutup</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mesyuarat Agung Tahunan (AGM)</h1>
          <p className="text-gray-600 mt-1">
            {isManagement ? 'Urus AGM dan resolusi' : 'Lihat dan undi dalam AGM'}
          </p>
        </div>
        {isManagement && (
          <Link href="/dashboard/agm/create">
            <Button>Cipta AGM Baharu</Button>
          </Link>
        )}
      </div>

      {agms.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">Tiada AGM buat masa ini</p>
          {isManagement && (
            <Link href="/dashboard/agm/create">
              <Button>Cipta AGM Pertama</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {agms.map((agm) => {
            const totalVotes = agm.resolutions.reduce(
              (sum, res) => sum + res._count.votes,
              0
            );

            return (
              <Card key={agm.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold">{agm.title}</h2>
                      {getStatusBadge(agm.status)}
                    </div>
                    {agm.description && (
                      <p className="text-gray-600 mb-2">{agm.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>
                        📅 {new Date(agm.meetingDate).toLocaleDateString('ms-MY', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span>📋 {agm._count.resolutions} resolusi</span>
                      <span>🗳️ {totalVotes} undian</span>
                    </div>
                  </div>
                  {isManagement && (
                    <AGMActions agm={agm} />
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <Link href={`/dashboard/agm/${agm.id}`}>
                    <Button variant="outline">
                      {isManagement ? 'Lihat Butiran' : 'Lihat & Undi'}
                    </Button>
                  </Link>
                  {isManagement && agm.status === 'CLOSED' && (
                    <Link href={`/dashboard/agm/${agm.id}/results`}>
                      <Button variant="outline">Lihat Keputusan</Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

