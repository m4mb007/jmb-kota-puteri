import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VotingForm } from './voting-form';
import { checkVotingEligibility } from '@/lib/actions/agm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AGMDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const agm = await prisma.aGM.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      resolutions: {
        include: {
          votes: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
              unit: {
                select: {
                  unitNumber: true,
                },
              },
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!agm) {
    notFound();
  }

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);
  
  // Check voting eligibility for residents
  let eligibility = null;
  let userVotes = new Map();
  
  if (!isManagement) {
    eligibility = await checkVotingEligibility(session.user.id);
    
    // Get user's existing votes
    const existingVotes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        resolution: {
          agmId: id,
        },
      },
    });
    
    existingVotes.forEach(vote => {
      userVotes.set(vote.resolutionId, vote.choice);
    });
  }

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

  const canVote = !isManagement && agm.status === 'ACTIVE' && eligibility?.eligible;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/agm">
          <Button variant="outline" size="sm">← Kembali</Button>
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{agm.title}</h1>
              {getStatusBadge(agm.status)}
            </div>
            {agm.description && (
              <p className="text-gray-600 mb-3">{agm.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>
                📅 {new Date(agm.meetingDate).toLocaleDateString('ms-MY', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>👤 Dicipta oleh {agm.createdBy.name}</span>
            </div>
          </div>
        </div>

        {/* Voting Eligibility Status */}
        {!isManagement && eligibility && (
          <div className="mt-4">
            {eligibility.eligible ? (
              agm.status === 'ACTIVE' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✅ Anda layak mengundi dalam AGM ini
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Tiada tunggakan. Sila undi pada resolusi di bawah.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">
                    AGM ini {agm.status === 'DRAFT' ? 'belum aktif' : 'telah ditutup'}.
                    Pengundian tidak dibenarkan.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  ❌ Anda tidak layak mengundi
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {eligibility.reason}
                </p>
                {eligibility.arrearsAmount && eligibility.arrearsAmount > 0 && (
                  <div className="mt-3">
                    <Link href="/dashboard/billing">
                      <Button size="sm" variant="outline">
                        Lihat & Bayar Tunggakan
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Resolusi ({agm.resolutions.length})</h2>
        
        {agm.resolutions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Tiada resolusi buat masa ini</p>
          </Card>
        ) : (
          agm.resolutions.map((resolution, index) => {
            const voteCounts = {
              SETUJU: resolution.votes.filter(v => v.choice === 'SETUJU').length,
              TIDAK_SETUJU: resolution.votes.filter(v => v.choice === 'TIDAK_SETUJU').length,
              BERKECUALI: resolution.votes.filter(v => v.choice === 'BERKECUALI').length,
            };
            
            const totalVotes = resolution.votes.length;
            const userVote = userVotes.get(resolution.id);

            return (
              <Card key={resolution.id} className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {index + 1}. {resolution.title}
                  </h3>
                  {resolution.description && (
                    <p className="text-gray-600">{resolution.description}</p>
                  )}
                </div>

                {/* Vote Counts (visible to all) */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {voteCounts.SETUJU}
                    </div>
                    <div className="text-sm text-green-600">Setuju</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-700">
                      {voteCounts.TIDAK_SETUJU}
                    </div>
                    <div className="text-sm text-red-600">Tidak Setuju</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-700">
                      {voteCounts.BERKECUALI}
                    </div>
                    <div className="text-sm text-gray-600">Berkecuali</div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Jumlah undian: {totalVotes}
                </div>

                {/* Voting Form (only for eligible residents) */}
                {canVote && (
                  <VotingForm 
                    resolutionId={resolution.id} 
                    currentVote={userVote}
                  />
                )}

                {/* User's vote status */}
                {!isManagement && userVote && (
                  <div className="mt-3 text-sm">
                    <Badge variant="outline">
                      Undi anda: {userVote === 'SETUJU' ? 'Setuju' : 
                                  userVote === 'TIDAK_SETUJU' ? 'Tidak Setuju' : 
                                  'Berkecuali'}
                    </Badge>
                  </div>
                )}

                {/* Management view - show voter details */}
                {isManagement && resolution.votes.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700">
                      Lihat butiran pengundi ({totalVotes})
                    </summary>
                    <div className="mt-3 space-y-2">
                      {resolution.votes.map((vote) => (
                        <div key={vote.id} className="text-sm flex justify-between items-center py-2 border-b">
                          <div>
                            <span className="font-medium">{vote.user.name}</span>
                            {vote.unit && (
                              <span className="text-gray-500 ml-2">({vote.unit.unitNumber})</span>
                            )}
                          </div>
                          <Badge variant="outline">
                            {vote.choice === 'SETUJU' ? 'Setuju' : 
                             vote.choice === 'TIDAK_SETUJU' ? 'Tidak Setuju' : 
                             'Berkecuali'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

