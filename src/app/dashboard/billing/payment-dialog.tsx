'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CreditCard, Banknote } from 'lucide-react';
import { uploadReceipt, initiateFPXPayment } from '@/lib/actions/billing';

interface PaymentDialogProps {
  bill: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ bill, isOpen, onOpenChange }: PaymentDialogProps) {
  const [activeTab, setActiveTab] = useState<'fpx' | 'manual'>('fpx');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFPXPayment = async () => {
    if (!confirm('Anda akan dibawa ke gerbang pembayaran FPX (Simulasi). Teruskan?')) return;

    setIsLoading(true);
    try {
      const result = await initiateFPXPayment(bill.id);
      if (result.success) {
        alert(result.message);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal memproses pembayaran FPX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('Sila pilih fail resit');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Fail terlalu besar (Max 5MB)');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('billId', bill.id);
    formData.append('file', file);

    try {
      await uploadReceipt(formData);
      alert('Resit berjaya dimuat naik');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert('Gagal memuat naik resit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Pembayaran</DialogTitle>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex w-full rounded-md bg-slate-100 p-1 mt-4">
          <button
            onClick={() => setActiveTab('fpx')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'fpx' 
                ? 'bg-white text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            FPX / Online
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
              activeTab === 'manual' 
                ? 'bg-white text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            Manual / Resit
          </button>
        </div>

        <div className="py-4">
          {activeTab === 'fpx' ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                <p className="font-medium">Bayar Secara Terus (FPX)</p>
                <p className="text-sm mt-1 text-blue-600">
                  Pembayaran akan disahkan serta-merta dan resit akan dijana secara automatik.
                </p>
              </div>
              
              <div className="flex justify-center py-4">
                <Banknote className="h-16 w-16 text-slate-300" />
              </div>

              <div className="text-sm text-slate-500">
                Jumlah Perlu Dibayar: <span className="font-bold text-slate-900">RM {bill.amount.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualUpload} className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800">
                <p className="font-medium">Muat Naik Resit</p>
                <p className="text-sm mt-1 text-yellow-700">
                  Sila buat pembayaran ke akaun JMB dan muat naik bukti pembayaran di sini. Admin akan mengesahkan pembayaran anda.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Fail Resit (PDF/Gambar)</Label>
                <Input
                  id="receipt"
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,application/pdf"
                  disabled={isLoading}
                />
              </div>

              <div className="text-sm text-slate-500 text-center pt-2">
                Jumlah Perlu Dibayar: <span className="font-bold text-slate-900">RM {bill.amount.toFixed(2)}</span>
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          
          {activeTab === 'fpx' ? (
            <Button onClick={handleFPXPayment} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Bayar Sekarang
            </Button>
          ) : (
            <Button onClick={handleManualUpload} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Hantar Resit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
