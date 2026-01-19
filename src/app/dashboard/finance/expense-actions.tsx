'use client';

import { Button } from '@/components/ui/button';
import { approveExpense, rejectExpense } from '@/lib/actions/finance';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseActions({ id }: { id: string }) {
  async function handleApprove() {
    try {
      await approveExpense(id);
      toast.success('Expense approved');
    } catch {
      toast.error('Failed to approve');
    }
  }

  async function handleReject() {
    try {
      await rejectExpense(id);
      toast.success('Expense rejected');
    } catch {
      toast.error('Failed to reject');
    }
  }

  return (
    <div className="flex space-x-2">
      <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={handleApprove}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={handleReject}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
