
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import EditUserForm from '@/components/users/edit-user-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }
  
  // Serialize dates/nulls to avoid "Date object" serialization error in Client Component
  const serializedUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Kemaskini Pengguna: {user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditUserForm user={serializedUser} />
        </CardContent>
      </Card>
    </div>
  );
}
