'use client';

import { uploadReceipt, verifyPayment, adminManualPayment, getRelatedUnpaidBill } from '@/lib/actions/billing';
import { Button } from '@/components/ui/button';
import { Check, X, Upload, FileText, Loader2, Download, CreditCard } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BillPDF } from '@/components/pdf/BillPDF';
import { PaymentDialog } from './payment-dialog';

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(userRole);
  const isOwner = ['OWNER', 'TENANT'].includes(userRole);
  const { id, status, receiptUrl } = bill;
  
  // Check if it's a manual payment receipt
  const isManualReceipt = receiptUrl && receiptUrl.includes('manual-receipt');

  const handleAdminManualPaymentClick = () => {
    const ref = window.prompt('Masukkan nombor rujukan bayaran (contoh: FPX / bank):');
    if (!ref || !ref.trim()) {
      alert('Nombor rujukan diperlukan untuk bayaran manual.');
      return;
    }
    setManualReference(ref.trim());
    adminFileInputRef.current?.click();
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

  const handleVerify = async (approved: boolean) => {
    if (!confirm(approved ? 'Sahkan pembayaran ini?' : 'Tolak pembayaran ini?')) return;
    
    setIsVerifying(true);
    try {
      await verifyPayment(id, approved);
    } catch (error) {
      console.error(error);
      alert('Gagal mengemaskini status');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end items-center">
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
    </div>
  );
}
