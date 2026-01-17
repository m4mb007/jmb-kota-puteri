import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUnit } from '@/lib/actions/units';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cipta Unit Baru',
};

export default async function CreateUnitPage() {
  const session = await auth();
  
  // Protect page: Only SUPER_ADMIN and JMB can access
  if (!session || !session.user || !['SUPER_ADMIN', 'JMB'].includes(session.user.role)) {
    redirect('/dashboard/units');
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/units">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Unit Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Butiran Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUnit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Nombor Lot</Label>
                <Input 
                  id="lotNumber" 
                  name="lotNumber" 
                  placeholder="Contoh: J-13" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitNumber">Nombor Unit</Label>
                <Input 
                  id="unitNumber" 
                  name="unitNumber" 
                  placeholder="Contoh: J-13-1" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Jenis Unit</Label>
              <Select name="type" required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATAS">Unit Atas</SelectItem>
                  <SelectItem value="BAWAH">Unit Bawah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Maklumat Parking (Aksesori)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parking1">Parking 1</Label>
                  <Input 
                    id="parking1" 
                    name="parking1" 
                    placeholder="No. Parking" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parking2">Parking 2</Label>
                  <Input 
                    id="parking2" 
                    name="parking2" 
                    placeholder="No. Parking" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Cipta Unit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
