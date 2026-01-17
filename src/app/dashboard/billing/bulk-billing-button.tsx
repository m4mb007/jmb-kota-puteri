'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { generateMonthlyBills } from '@/lib/actions/billing';
import { Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function BulkBillingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [month, setMonth] = useState<string>(new Date().getMonth() + 1 + '');
  const [year, setYear] = useState<string>(new Date().getFullYear() + '');

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateMonthlyBills(parseInt(month), parseInt(year));
      if (result.success) {
        toast.success(`Berjaya menjana ${result.count} bil untuk bulan ${month}/${year}`);
        setIsOpen(false);
      }
    } catch (error) {
      toast.error('Gagal menjana bil');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Jana Bil Bulanan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jana Bil Bulanan (Bulk)</DialogTitle>
          <DialogDescription>
            Tindakan ini akan mencipta bil RM 88.00 (RM 80 Maintenance + RM 8 Sinking Fund) untuk SEMUA unit bagi bulan yang dipilih. Bil yang sudah wujud tidak akan diduplikasi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Bulan
            </Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(0, m - 1).toLocaleString('ms-MY', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Tahun
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Jana Bil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
