'use client';

import { uploadReceipt, verifyPayment, adminManualPayment, getRelatedUnpaidBill, refundDeposit, approveRefund } from '@/lib/actions/billing';
import { Button } from '@/components/ui/button';
import { Check, X, Upload, FileText, Loader2, Download, CreditCard, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BillPDF } from '@/components/pdf/BillPDF';
import { PaymentDialog } from './payment-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function BillActions({ 
  bill,
  userRole 
}: { 
  bill: any; // Using any for simplicity here as we passed full object
  userRole: string;
}) {
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [manualReference, setManualReference] = useState('');
  
  // Refund Dialog State
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReference, setRefundReference] = useState('');
  const [refundFile, setRefundFile] = useState<File | null>(null);
  const [refundChecklist, setRefundChecklist] = useState({
    renovation: false,
    moving: false,
    cleanliness: false,
    noDamage: false,
    keysReturned: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = ['SUPER_ADMIN', 'JMB', 'STAFF', 'FINANCE'].includes(userRole);
  const isFinance = ['SUPER_ADMIN', 'FINANCE'].includes(userRole);
  const isOwner = ['OWNER', 'TENANT'].includes(userRole);
  const { id, status, receiptUrl, type } = bill;
  
  // Check if it's a manual payment receipt
  const isManualReceipt = receiptUrl && receiptUrl.includes('manual-receipt');

  const handleVerify = async (approved: boolean) => {
    if (!confirm(approved ? 'Adakah anda pasti mahu mengesahkan pembayaran ini?' : 'Adakah anda pasti mahu menolak pembayaran ini?')) return;
    
    setIsVerifying(true);
    try {
      await verifyPayment(id, approved);
      alert(approved ? 'Pembayaran disahkan' : 'Pembayaran ditolak');
    } catch (error) {
      alert('Gagal mengemaskini status');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminManualPaymentClick = () => {
    const ref = window.prompt('Masukkan nombor rujukan bayaran (contoh: FPX / bank):');
    if (!ref || !ref.trim()) {
      alert('Nombor rujukan diperlukan untuk bayaran manual.');
      return;
    }
    setManualReference(ref.trim());
    adminFileInputRef.current?.click();
  };

  const handleRefundClick = () => {
    setRefundReference('');
    setRefundFile(null);
    setRefundChecklist({
      renovation: false,
      moving: false,
      cleanliness: false,
      noDamage: false,
      keysReturned: false,
    });
    setShowRefundDialog(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundReference && !refundFile && !Object.values(refundChecklist).some(Boolean)) {
        alert("Sila lengkapkan sekurang-kurangnya satu syarat (catatan/gambar/senarai semak).");
        return;
    }

    if (!confirm('Adakah anda pasti mahu memulangkan deposit ini? Tindakan ini tidak boleh diundur.')) {
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('billId', id);
    if (refundFile) formData.append('file', refundFile);
    
    // Construct reference string with checklist
    const checklistItems = [];
    if (refundChecklist.renovation) checklistItems.push('Selesai Renovation');
    if (refundChecklist.moving) checklistItems.push('Selesai Pindah Barang');
    if (refundChecklist.cleanliness) checklistItems.push('Kebersihan Unit OK');
    if (refundChecklist.noDamage) checklistItems.push('Tiada Kerosakan');
    if (refundChecklist.keysReturned) checklistItems.push('Kunci/Kad Akses Dipulangkan');
    
    let finalReference = refundReference;
    if (checklistItems.length > 0) {
      const checklistStr = `[Semakan: ${checklistItems.join(', ')}]`;
      finalReference = finalReference ? `${finalReference} ${checklistStr}` : checklistStr;
    }
    
    if (finalReference) formData.append('referenceNumber', finalReference);

    try {
      await refundDeposit(formData);
      alert('Permohonan pulangan deposit berjaya dihantar. Menunggu kelulusan Kewangan.');
      setShowRefundDialog(false);
      setRefundReference('');
      setRefundFile(null);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Gagal memulangkan deposit.');
    } finally {
      setIsUploading(false);
    }
  };

  const [financeApproveDialog, setFinanceApproveDialog] = useState(false);
  const [financeProofFile, setFinanceProofFile] = useState<File | null>(null);

  const handleApproveRefund = async () => {
    if (!financeProofFile) {
      alert('Sila muat naik bukti pembayaran (resit).');
      return;
    }

    if (!confirm('Adakah anda pasti mahu meluluskan pulangan deposit ini?')) return;
    
    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append('billId', id);
      formData.append('file', financeProofFile);

      await approveRefund(formData);
      alert('Pulangan deposit diluluskan.');
      setFinanceApproveDialog(false);
    } catch (error: any) {
      alert(error?.message || 'Gagal meluluskan pulangan.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      alert('Resit diperlukan untuk bayaran manual. Sila pilih fail resit.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Fail terlalu besar (Max 5MB)');
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Format fail tidak sah. Sila muat naik JPG, PNG atau PDF sahaja.');
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }

    // Check for related bill
    let confirmMessage = 'Adakah anda pasti mahu menandakan bil ini sebagai DIBAYAR (Manual)? Pembayaran ini akan diluluskan secara automatik.';
    let relatedBill = null;

    try {
      relatedBill = await getRelatedUnpaidBill(id);
      if (relatedBill) {
        confirmMessage = `Bil ini mempunyai pasangan ${relatedBill.type === 'MAINTENANCE' ? 'Maintenance' : 'Sinking Fund'} (RM ${relatedBill.amount.toFixed(2)}). Adakah anda mahu membayar KEDUA-DUA bil sekali gus?`;
      }
    } catch (err) {
      console.error("Error checking related bill", err);
    }

    if (!confirm(confirmMessage)) {
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('billId', id);
    formData.append('file', file);
    formData.append('referenceNumber', manualReference);
    if (relatedBill) {
      formData.append('includeRelated', 'true');
    }

    try {
      await adminManualPayment(formData);
      alert('Pembayaran manual berjaya direkodkan');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Gagal mengemaskini status');
    } finally {
      setIsUploading(false);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2 justify-end items-center">
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pulangan Deposit (Pindah Masuk/Keluar)</DialogTitle>
            <DialogDescription>
              Sila muat naik <strong>bukti perpindahan</strong> (gambar selesai pindah masuk atau keluar) sebagai syarat pemulangan deposit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Senarai Semak
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="renovation" 
                    checked={refundChecklist.renovation}
                    onCheckedChange={(checked) => setRefundChecklist(prev => ({ ...prev, renovation: !!checked }))}
                  />
                  <Label htmlFor="renovation" className="font-normal cursor-pointer">Selesai Renovation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="moving" 
                    checked={refundChecklist.moving}
                    onCheckedChange={(checked) => setRefundChecklist(prev => ({ ...prev, moving: !!checked }))}
                  />
                  <Label htmlFor="moving" className="font-normal cursor-pointer">Selesai Pindah Barang</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="cleanliness" 
                    checked={refundChecklist.cleanliness}
                    onCheckedChange={(checked) => setRefundChecklist(prev => ({ ...prev, cleanliness: !!checked }))}
                  />
                  <Label htmlFor="cleanliness" className="font-normal cursor-pointer">Kebersihan Unit Memuaskan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="noDamage" 
                    checked={refundChecklist.noDamage}
                    onCheckedChange={(checked) => setRefundChecklist(prev => ({ ...prev, noDamage: !!checked }))}
                  />
                  <Label htmlFor="noDamage" className="font-normal cursor-pointer">Tiada Kerosakan Harta Bersama</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="keysReturned" 
                    checked={refundChecklist.keysReturned}
                    onCheckedChange={(checked) => setRefundChecklist(prev => ({ ...prev, keysReturned: !!checked }))}
                  />
                  <Label htmlFor="keysReturned" className="font-normal cursor-pointer">Kunci / Kad Akses Dipulangkan</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                Gambar Bukti
              </Label>
              <div className="col-span-3">
                <Input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setRefundFile(e.target.files?.[0] || null)}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  *Muat naik gambar keadaan unit, bukti pembersihan, atau serahan kunci.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ref" className="text-right">
                Catatan Tambahan
              </Label>
              <Input
                id="ref"
                value={refundReference}
                onChange={(e) => setRefundReference(e.target.value)}
                className="col-span-3"
                placeholder="Contoh: Unit dalam keadaan baik, tiada hutang tertunggak."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>Batal</Button>
            <Button onClick={handleRefundSubmit} disabled={isUploading || (!refundReference && !refundFile)}>
              {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Sahkan Pulangan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PaymentDialog 
        bill={bill} 
        isOpen={showPaymentDialog} 
        onOpenChange={setShowPaymentDialog} 
      />

      {/* Export PDF */}
      {isClient && (
        <PDFDownloadLink
          document={<BillPDF bill={bill} />}
          fileName={`Invois-${bill.unit.unitNumber}-${bill.month}-${bill.year}.pdf`}
        >
          {({ loading }) => (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Muat Turun PDF"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          )}
        </PDFDownloadLink>
      )}

      {/* View Refund Proof */}
      {bill.refundProofUrl && (
        <a 
          href={bill.refundProofUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          title="Lihat Gambar Rumah"
          className="inline-block"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 border-amber-200 text-amber-600 hover:bg-amber-50"
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline-block">
              Gambar Rumah
            </span>
          </Button>
        </a>
      )}

      {/* View Receipt */}
      {receiptUrl && (
        <a 
          href={receiptUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          title={isManualReceipt ? "Lihat Resit (Bayaran Manual)" : "Lihat Resit"}
          className="inline-block"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 gap-2 ${isManualReceipt ? 'border-purple-200 text-purple-600 hover:bg-purple-50' : ''}`}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline-block">
              {isManualReceipt ? 'Resit Manual' : 'Resit'}
            </span>
          </Button>
        </a>
      )}

      {/* Make Payment (Owner/Tenant) */}
      {isOwner && (status === 'PENDING' || status === 'REJECTED') && (
        <Button
          variant="default"
          size="sm"
          className="h-8 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          title="Buat Pembayaran"
          onClick={() => setShowPaymentDialog(true)}
        >
          <CreditCard className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:inline-block">Bayar</span>
        </Button>
      )}

      {/* Manual Payment (Admin) */}
      {isAdmin && (status === 'PENDING' || status === 'REJECTED') && (
        <>
          <input
            type="file"
            ref={adminFileInputRef}
            className="hidden"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleAdminFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            title="Bayaran Manual (Tunai/Resit)"
            onClick={handleAdminManualPaymentClick}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          </Button>
        </>
      )}

      {/* Verify Payment (Admin) */}
      {isAdmin && status === 'PAID' && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            title="Sahkan Pembayaran"
            onClick={() => handleVerify(true)}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            title="Tolak Pembayaran"
            onClick={() => handleVerify(false)}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        </>
      )}

      {/* Refund Deposit (Admin) */}
      {isAdmin && type === 'DEPOSIT' && status === 'APPROVED' && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
          title="Pulangkan Deposit"
          onClick={handleRefundClick}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        </Button>
      )}

      {/* Approve Refund (Finance) */}
      <Dialog open={financeApproveDialog} onOpenChange={setFinanceApproveDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pengesahan Pulangan Deposit</DialogTitle>
            <DialogDescription>
              Sila semak bukti pulangan dan muat naik bukti pembayaran kepada pemilik/penyewa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left: Proof from JMB */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Bukti Pulangan (Dari JMB)</h3>
              <div className="border rounded-lg p-2 bg-slate-50 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                {bill.refundProofUrl ? (
                  <img 
                    src={bill.refundProofUrl} 
                    alt="Bukti Pulangan" 
                    className="max-w-full max-h-[400px] object-contain rounded-md"
                  />
                ) : (
                  <div className="text-center text-slate-500 text-sm">
                    <p>Tiada gambar bukti.</p>
                  </div>
                )}
              </div>
              {bill.refundProofUrl && (
                <div className="text-center">
                   <a 
                    href={bill.refundProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Buka dalam tab baru
                  </a>
                </div>
              )}
            </div>

            {/* Right: Payment Upload by Finance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Tindakan Kewangan</h3>
              <div className="space-y-4 p-4 border rounded-lg bg-white">
                <div className="space-y-2">
                  <Label htmlFor="finance-file">Muat Naik Resit Pembayaran</Label>
                  <Input
                    id="finance-file"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => setFinanceProofFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[10px] text-slate-500">
                    *Sila muat naik bukti pembayaran deposit kepada pemilik.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFinanceApproveDialog(false)}>Batal</Button>
            <Button 
              onClick={handleApproveRefund} 
              disabled={isVerifying || !financeProofFile}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isVerifying ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Sahkan & Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isFinance && status === 'REFUND_PROCESSING' && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          title="Luluskan Pulangan"
          onClick={() => setFinanceApproveDialog(true)}
          disabled={isVerifying}
        >
          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
