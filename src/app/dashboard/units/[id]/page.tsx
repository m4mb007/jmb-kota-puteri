
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import EditUnitForm from '@/components/units/edit-unit-form';

export default async function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      owner: true,
      tenant: true,
      parkings: true,
    },
  });

  if (!unit) {
    notFound();
  }

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  // Serialize data to avoid "Date object" errors in Client Component
  const serializedUnit = JSON.parse(JSON.stringify(unit));
  const serializedUsers = JSON.parse(JSON.stringify(users));

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Kemaskini Unit: {unit.unitNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUnitForm unit={serializedUnit} users={serializedUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
