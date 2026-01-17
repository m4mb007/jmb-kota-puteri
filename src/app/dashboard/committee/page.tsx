import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, User, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ahli Jawatankuasa',
};

export default async function CommitteePage() {
  const session = await auth();
  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  // Fetch committee members
  const committeeMembers = await prisma.user.findMany({
    where: {
      committeeType: {
        in: ['JMB', 'COMMUNITY'],
      },
    },
    include: {
      ownedUnits: true,
      rentedUnits: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const jmbMembers = committeeMembers.filter((m) => m.committeeType === 'JMB');
  const communityMembers = committeeMembers.filter((m) => m.committeeType === 'COMMUNITY');

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ahli Jawatankuasa</h1>
        <p className="text-muted-foreground">Senarai Ahli Jawatankuasa JMB dan Komuniti.</p>
      </div>

      {/* JMB Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Badge variant="default" className="text-base px-3 py-1 bg-blue-600">AJK JMB</Badge>
        </h2>
        {jmbMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jmbMembers.map((member) => (
              <CommitteeCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">Tiada ahli JMB disenaraikan.</p>
        )}
      </section>

      {/* Community Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">AJK Komuniti</Badge>
        </h2>
        {communityMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communityMembers.map((member) => (
              <CommitteeCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic">Tiada ahli komuniti disenaraikan.</p>
        )}
      </section>
    </div>
  );
}

function CommitteeCard({ member }: { member: any }) {
  // Get primary unit (owned or rented)
  const unit = member.ownedUnits[0] || member.rentedUnits[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{member.name}</CardTitle>
            <p className="text-sm font-medium text-blue-600 mt-1">
              {member.committeePosition || 'AJK'}
            </p>
          </div>
          {member.role === 'JMB' || member.role === 'SUPER_ADMIN' ? (
             <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Official</Badge>
          ) : (
             <Badge variant="outline" className="text-slate-500">Volunteer</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="h-4 w-4" />
          <span>{member.phone}</span>
        </div>
        
        {unit && (
          <div className="flex items-center gap-2 text-slate-600">
            <Home className="h-4 w-4" />
            <span>Unit {unit.unitNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <User className="h-4 w-4" />
          <span className="capitalize">{member.role.toLowerCase().replace('_', ' ')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
