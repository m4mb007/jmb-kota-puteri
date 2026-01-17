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
import { createNotice } from '@/lib/actions/notices';
import { ArrowLeft } from 'lucide-react';

export default async function CreateNoticePage() {
  const session = await auth();
  
  // Protect page: Only SUPER_ADMIN can access
  if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard/notices');
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Cipta Notis Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Butiran Notis</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createNotice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tajuk Notis</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Contoh: Penyelenggaraan Lif" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Sasaran Penerima</Label>
              <Select name="target" required defaultValue="ALL">
                <SelectTrigger id="target">
                  <SelectValue placeholder="Pilih Sasaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Unit</SelectItem>
                  <SelectItem value="ATAS_ONLY">Unit Atas Sahaja</SelectItem>
                  <SelectItem value="BAWAH_ONLY">Unit Bawah Sahaja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Kandungan Notis</Label>
              <textarea
                id="content"
                name="content"
                className="flex min-h-[150px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tulis kandungan notis di sini..."
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Terbitkan Notis</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
