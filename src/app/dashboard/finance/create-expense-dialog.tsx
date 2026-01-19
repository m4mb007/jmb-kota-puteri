'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createExpense } from '@/lib/actions/finance';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface ExpenseCategoryOption {
  id: string;
  name: string;
}

interface FundOption {
  id: string;
  name: string;
}

export function CreateExpenseDialog({ categories, funds }: { categories: ExpenseCategoryOption[]; funds: FundOption[] }) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      await createExpense(formData);
      toast.success('Expense created successfully');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create expense');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (RM)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <Label htmlFor="categoryId">Category</Label>
               <select id="categoryId" name="categoryId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required>
                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>
             <div>
               <Label htmlFor="fundId">Fund</Label>
               <select id="fundId" name="fundId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required>
                 {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
             </div>
          </div>
          <div>
             <Label htmlFor="attachment">Attachment (Bill/Invoice)</Label>
             <Input id="attachment" name="attachment" type="file" accept=".pdf,.jpg,.png" />
          </div>
          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
