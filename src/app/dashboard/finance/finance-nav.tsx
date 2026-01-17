'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function FinanceNav() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const tabs = [
    { name: 'Overview', value: 'overview' },
    { name: 'Expenses', value: 'expenses' },
    { name: 'Income', value: 'income' },
    { name: 'Reports', value: 'reports' },
  ];

  return (
    <div className="flex space-x-2 mb-6">
      {tabs.map((t) => (
        <Button
          key={t.value}
          variant={tab === t.value ? 'default' : 'outline'}
          asChild
        >
          <Link href={`/dashboard/finance?tab=${t.value}`}>
            {t.name}
          </Link>
        </Button>
      ))}
    </div>
  );
}
