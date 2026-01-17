import { prisma } from '@/lib/prisma';
import { createBill } from '@/lib/actions/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function getBaseBillAmount() {
  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT "value"
      FROM "SystemSetting"
      WHERE "key" = 'BASE_MONTHLY_BILL'
      LIMIT 1
    `;

    const raw = rows[0]?.value;
    const parsed = raw ? parseFloat(raw) : NaN;

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 88;
    }

    return parsed;
  } catch (error) {
    return 88;
  }
}

export default async function CreateBillPage() {
  const session = await auth();
  if (!session?.user || !['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role)) {
    redirect('/dashboard/billing');
  }

  const units = await prisma.unit.findMany({
    orderBy: { unitNumber: 'asc' },
  });

  const baseBillAmount = await getBaseBillAmount();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i); // Last year to next 3 years
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Cipta Bil Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBill} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit</Label>
              <Select name="unitId" required>
                <SelectTrigger id="unitId">
                  <SelectValue placeholder="-- Pilih Unit --" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (RM)</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00" 
                defaultValue={baseBillAmount.toFixed(2)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Jenis Dana</Label>
              <Select name="type" required defaultValue="MAINTENANCE">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih Jenis Dana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance Fund</SelectItem>
                  <SelectItem value="SINKING">Sinking Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Bulan</Label>
                <Select name="month" required defaultValue={(new Date().getMonth() + 1).toString()}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Tahun</Label>
                <Select name="year" required defaultValue={currentYear.toString()}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Cipta Bil</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
