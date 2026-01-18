import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getBaseBillAmounts() {
  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT "key", "value"
      FROM "SystemSetting"
      WHERE "key" IN ('BASE_MONTHLY_BILL_ATAS', 'BASE_MONTHLY_BILL_BAWAH')
    `;

    let atas = 95;
    let bawah = 88;

    for (const row of rows) {
      const parsed = parseFloat(row.value);
      if (Number.isFinite(parsed) && parsed > 0) {
        if (row.key === 'BASE_MONTHLY_BILL_ATAS') {
          atas = parsed;
        } else if (row.key === 'BASE_MONTHLY_BILL_BAWAH') {
          bawah = parsed;
        }
      }
    }

    return { atas, bawah };
  } catch (error) {
    return { atas: 95, bawah: 88 };
  }
}

async function updateBaseBill(formData: FormData) {
  'use server';

  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    throw new Error('Tidak dibenarkan');
  }

  const rawValueAtas = String(formData.get('baseBillAtas') || '').trim().replace(',', '.');
  const rawValueBawah = String(formData.get('baseBillBawah') || '').trim().replace(',', '.');
  
  const amountAtas = parseFloat(rawValueAtas);
  const amountBawah = parseFloat(rawValueBawah);

  if (!Number.isFinite(amountAtas) || amountAtas <= 0 || !Number.isFinite(amountBawah) || amountBawah <= 0) {
    return;
  }

  const valueStringAtas = amountAtas.toFixed(2);
  const valueStringBawah = amountBawah.toFixed(2);

  try {
    await prisma.$executeRaw`
      INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, 'BASE_MONTHLY_BILL_ATAS', ${valueStringAtas}, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = ${valueStringAtas}, "updatedAt" = NOW()
    `;
    
    await prisma.$executeRaw`
      INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, 'BASE_MONTHLY_BILL_BAWAH', ${valueStringBawah}, NOW(), NOW())
      ON CONFLICT ("key") DO UPDATE SET "value" = ${valueStringBawah}, "updatedAt" = NOW()
    `;
  } catch (error: any) {
    // Extract PostgreSQL error code from Prisma error
    let pgErrorCode: string | null = null;
    let isPermissionError = false;
    let isTableNotFoundError = false;
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Check meta property for error code
      pgErrorCode = error.meta?.code as string | undefined || null;
      
      // If not in meta, try to extract from message
      if (!pgErrorCode && error.message) {
        const codeMatch = error.message.match(/Code: `(\d+)`/);
        if (codeMatch) {
          pgErrorCode = codeMatch[1];
        }
        
        // Fallback: check message content
        if (error.message.includes('permission denied')) {
          isPermissionError = true;
        }
        if (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist')) {
          isTableNotFoundError = true;
        }
      }
    } else if (error?.code) {
      pgErrorCode = error.code;
    }
    
    // 42P01 = table does not exist, 42501 = permission denied
    if (pgErrorCode === '42P01' || pgErrorCode === '42501' || isPermissionError || isTableNotFoundError) {
      const errorType = isPermissionError || pgErrorCode === '42501' 
        ? 'permission denied' 
        : 'table does not exist';
      console.error(
        `SystemSetting table access error (${errorType}); billing settings change was not persisted.`
      );
      return;
    }
    throw error;
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard/users');
  revalidatePath('/dashboard/billing');
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);
  const baseBillAmounts = await getBaseBillAmounts();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tetapan Sistem</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ubah suai nilai asas bil penyelenggaraan bulanan mengikut jenis unit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kadar Bil Bulanan Asas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              Nilai ini digunakan sebagai bil asas bulanan untuk setiap jenis unit 
              (Unit Atas: RM {baseBillAmounts.atas.toFixed(2)}, Unit Bawah: RM {baseBillAmounts.bawah.toFixed(2)})
              dan sebagai rujukan dalam simulasi pelan ansuran tunggakan.
            </div>
          </div>

          {isManagement ? (
            <form action={updateBaseBill} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="baseBillAtas">Jumlah bil bulanan Unit Atas (RM)</Label>
                <Input
                  id="baseBillAtas"
                  name="baseBillAtas"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={baseBillAmounts.atas.toFixed(2)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseBillBawah">Jumlah bil bulanan Unit Bawah (RM)</Label>
                <Input
                  id="baseBillBawah"
                  name="baseBillBawah"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={baseBillAmounts.bawah.toFixed(2)}
                />
              </div>
              <Button type="submit">
                Simpan Perubahan
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Bil bulanan Unit Atas</span>
                  <span className="font-semibold">
                    RM {baseBillAmounts.atas.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Bil bulanan Unit Bawah</span>
                  <span className="font-semibold">
                    RM {baseBillAmounts.bawah.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Hanya pihak pengurusan boleh mengubah tetapan ini.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
