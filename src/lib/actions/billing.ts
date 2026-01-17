'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createAuditLog } from '@/lib/actions/audit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email';

export async function verifyPayment(id: string, approved: boolean) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new Error('Bill not found');

  if (bill.status === 'APPROVED') {
    // Already approved, do nothing to avoid double income
    return; 
  }

  const status: 'APPROVED' | 'REJECTED' = approved ? 'APPROVED' : 'REJECTED';

  const updatedBill = await prisma.bill.update({
    where: { id },
    data: { status },
  });

  if (status === 'APPROVED') {
    const fund = await prisma.fund.findUnique({ where: { code: updatedBill.type } });
    if (fund) {
      await prisma.incomeCollection.create({
        data: {
          amount: updatedBill.amount,
          date: new Date(updatedBill.year, updatedBill.month - 1, 1),
          source: updatedBill.type,
          unitId: updatedBill.unitId,
          fundId: fund.id
        }
      });
    }
  }

  await createAuditLog('VERIFY_PAYMENT', `Verified payment for Bill ${id}: ${status}`);
  revalidatePath('/dashboard/billing');
}

import { generateBillsLogic } from '@/lib/services/billing';

export async function generateMonthlyBills(month: number, year: number) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const result = await generateBillsLogic(month, year);
  
  await createAuditLog('GENERATE_MONTHLY_BILLS', `Generated ${result.count} bills for ${month}/${year}`);
  revalidatePath('/dashboard/billing');
  return result;
}

export async function uploadReceipt(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const billId = formData.get('billId') as string;
  const file = formData.get('file') as File;

  if (!billId || !file) {
    throw new Error('File is required');
  }

  // Verify ownership/authorization
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { unit: true },
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);
  const isOwnerOrTenant = bill.unit.ownerId === session.user.id || bill.unit.tenantId === session.user.id;

  if (!isManagement && !isOwnerOrTenant) {
    throw new Error('Unauthorized: You can only upload receipts for your own units.');
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Format fail tidak sah. Sila muat naik JPG, PNG atau PDF sahaja.');
  }

  // Validate file size (e.g., 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Saiz fail terlalu besar (Max 5MB).');
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `receipt-${billId}-${timestamp}.${extension}`;
    
    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Update bill
    const receiptUrl = `/uploads/receipts/${filename}`;
    await prisma.bill.update({
      where: { id: billId },
      data: {
        receiptUrl,
        status: 'PAID', // Mark as PAID (Pending Approval)
      },
    });

    await createAuditLog('UPLOAD_RECEIPT', `Uploaded receipt for Bill ${billId}`);

  } catch (error) {
    console.error('Failed to upload receipt:', error);
    throw new Error('Gagal memuat naik resit.');
  }

  revalidatePath('/dashboard/billing');
}

export async function adminManualPayment(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const billId = formData.get('billId') as string;
  const file = formData.get('file') as File;
   const referenceNumber = formData.get('referenceNumber') as string;

  if (!billId) {
    throw new Error('Bill ID required');
  }

  if (!referenceNumber || !referenceNumber.trim()) {
    throw new Error('Nombor rujukan diperlukan untuk bayaran manual.');
  }

  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new Error('Bill not found');

  if (bill.status === 'APPROVED') {
    return; // Already approved
  }

  let receiptUrl = undefined;

  // Handle file upload if provided
  if (file && file.size > 0) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Format fail tidak sah. Sila muat naik JPG, PNG atau PDF sahaja.');
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Saiz fail terlalu besar (Max 5MB).');
    }

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `manual-receipt-${billId}-${timestamp}.${extension}`;
      
      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
      await mkdir(uploadDir, { recursive: true });

      // Save file
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      receiptUrl = `/uploads/receipts/${filename}`;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      throw new Error('Gagal memuat naik resit.');
    }
  }

  const status = 'APPROVED';

  const updatedBill = await prisma.bill.update({
    where: { id: billId },
    data: {
      status,
      receiptUrl: receiptUrl || bill.receiptUrl, // Keep existing if no new file
    },
  });

  // Create IncomeCollection since it's approved manually
  const fund = await prisma.fund.findUnique({ where: { code: updatedBill.type } });
  if (fund) {
    await prisma.incomeCollection.create({
      data: {
        amount: updatedBill.amount,
        date: new Date(updatedBill.year, updatedBill.month - 1, 1),
        source: updatedBill.type,
        unitId: updatedBill.unitId,
        fundId: fund.id,
        description: referenceNumber.trim(),
      }
    });
  }

  await createAuditLog('MANUAL_PAYMENT', `Manual payment for Bill ${billId} by admin (Ref: ${referenceNumber.trim()})`);
  revalidatePath('/dashboard/billing');
}

export async function initiateFPXPayment(billId: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new Error('Bill not found');

  if (bill.status === 'APPROVED') {
    throw new Error('Bill already paid');
  }

  // SIMULATION: In a real app, this would call ToyyibPay/Stripe API
  // and return a redirect URL.
  // Here we simulate a successful callback.

  const status = 'APPROVED'; // Auto-approve for FPX

  const updatedBill = await prisma.bill.update({
    where: { id: billId },
    data: { status },
  });

  // Create IncomeCollection
  const fund = await prisma.fund.findUnique({ where: { code: updatedBill.type } });
  if (fund) {
    await prisma.incomeCollection.create({
      data: {
        amount: updatedBill.amount,
        date: new Date(updatedBill.year, updatedBill.month - 1, 1),
        source: updatedBill.type,
        unitId: updatedBill.unitId,
        fundId: fund.id
      }
    });
  }

  await createAuditLog('FPX_PAYMENT', `FPX Payment success for Bill ${billId}`);
  revalidatePath('/dashboard/billing');
  
  return { success: true, message: 'Pembayaran FPX Berjaya (Simulasi)' };
}

export async function createBill(formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const unitId = formData.get('unitId') as string;
  const enteredAmount = parseFloat(formData.get('amount') as string);
  const month = parseInt(formData.get('month') as string);
  const year = parseInt(formData.get('year') as string);
  const type = (formData.get('type') as 'MAINTENANCE' | 'SINKING') || 'MAINTENANCE';

  if (!unitId || isNaN(enteredAmount) || isNaN(month) || isNaN(year)) {
    throw new Error('Semua medan wajib diisi dengan format yang betul');
  }

  try {
    // Get unit to fetch monthly adjustment
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        owner: true,
      },
    });

    if (!unit) {
      throw new Error('Unit tidak dijumpai');
    }

    // Calculate final amount: entered amount + adjustment (if any)
    const unitAdjustment = unit.monthlyAdjustmentAmount || 0;
    const finalAmount = enteredAmount + unitAdjustment;

    const bill = await prisma.bill.create({
      data: {
        unitId,
        amount: finalAmount,
        month,
        year,
        type,
        status: 'PENDING',
      },
      include: {
        unit: {
          include: {
            owner: true,
          },
        },
      },
    });

    await createAuditLog('CREATE_BILL', `Created bill for Unit ID ${unitId}: RM${finalAmount} (Base: RM${enteredAmount} + Adjustment: RM${unitAdjustment})`);

    // Send email to owner
    if (bill.unit.owner?.email) {
      await sendEmail({
        to: bill.unit.owner.email,
        subject: `Invois Baharu - ${bill.unit.unitNumber} (${month}/${year})`,
        html: EMAIL_TEMPLATES.billCreated(bill.unit.unitNumber, finalAmount, month, year),
      });
    }

  } catch (error) {
    console.error('Failed to create bill:', error);
    throw new Error('Gagal mencipta bil.');
  }

  revalidatePath('/dashboard/billing');
  redirect('/dashboard/billing');
}

export async function updateBillStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID') {
  const session = await auth();
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) throw new Error('Bill not found');

  // Prevent double approval/income creation
  if (bill.status === 'APPROVED' && status === 'APPROVED') {
    return;
  }

  try {
    const updatedBill = await prisma.bill.update({
      where: { id },
      data: { status },
    });

    if (status === 'APPROVED') {
      const fund = await prisma.fund.findUnique({ where: { code: updatedBill.type } });
      if (fund) {
        await prisma.incomeCollection.create({
          data: {
            amount: updatedBill.amount,
            date: new Date(updatedBill.year, updatedBill.month - 1, 1),
            source: updatedBill.type,
            unitId: updatedBill.unitId,
            fundId: fund.id
          }
        });
      }
    }

    await createAuditLog('UPDATE_BILL_STATUS', `Updated bill ${id} status to ${status}`);

  } catch (error) {
    console.error('Failed to update bill status:', error);
    throw new Error('Gagal mengemaskini status bil.');
  }

  revalidatePath('/dashboard/billing');
}
