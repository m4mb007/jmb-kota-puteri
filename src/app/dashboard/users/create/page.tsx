'use client';

import { createUser } from '@/lib/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function CreateUserPage() {
  const [role, setRole] = useState('OWNER');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Pengguna Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Penuh</Label>
              <Input id="name" name="name" placeholder="Nama Penuh" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Emel (Pilihan)</Label>
              <Input id="email" name="email" type="email" placeholder="contoh@emel.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. Telefon (WhatsApp)</Label>
              <Input id="phone" name="phone" type="tel" placeholder="0123456789" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icNumber">Nombor IC (Pilihan)</Label>
                <Input id="icNumber" name="icNumber" placeholder="Contoh: 800101-01-1234" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jantina (Pilihan)</Label>
                <Select name="gender">
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih Jantina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LELAKI">Lelaki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="religion">Agama (Pilihan)</Label>
              <Select name="religion">
                <SelectTrigger id="religion">
                  <SelectValue placeholder="Pilih Agama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISLAM">Islam</SelectItem>
                  <SelectItem value="BUDDHA">Buddha</SelectItem>
                  <SelectItem value="HINDU">Hindu</SelectItem>
                  <SelectItem value="KRISTIAN">Kristian</SelectItem>
                  <SelectItem value="LAIN_LAIN">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Laluan</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Peranan</Label>
              <Select name="role" required value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih Peranan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Pemilik (Owner)</SelectItem>
                  <SelectItem value="TENANT">Penyewa (Tenant)</SelectItem>
                  <SelectItem value="JMB">JMB</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'OWNER' && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="font-semibold text-lg">Maklumat Pemilik (Boleh dikemaskini kemudian)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="handoverDate">Tarikh Serah Kunci</Label>
                    <Input id="handoverDate" name="handoverDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="snpDate">Tarikh Sign SNP</Label>
                    <Input id="snpDate" name="snpDate" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="snpFile">Muat Naik SNP (Muka Depan)</Label>
                  <Input id="snpFile" name="snpFile" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileB">Muat Naik Fail B</Label>
                  <Input id="fileB" name="fileB" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fileC">Muat Naik Fail C</Label>
                  <Input id="fileC" name="fileC" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button type="submit">Cipta Pengguna</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
