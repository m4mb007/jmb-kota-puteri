import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CreateAGMForm } from './create-agm-form';

export default async function CreateAGMPage() {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cipta AGM Baharu</h1>
      <CreateAGMForm />
    </div>
  );
}

