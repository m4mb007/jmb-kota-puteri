
'use client';

import { updateUser } from '@/lib/actions/users';
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
import { useState } from 'react';
import { toast } from 'sonner';

interface EditUserFormProps {
  user: any;
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const [role, setRole] = useState(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateUserWithId = updateUser.bind(null, user.id);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateUserWithId(formData);
      toast.success('Pengguna berjaya dikemaskini');
    } catch (error: any) {
      if (error.message.includes('NEXT_REDIRECT')) {
        return; // Redirecting...
      }
      toast.error(error.message || 'Gagal mengemaskini pengguna');
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Penuh</Label>
        <Input id="name" name="name" placeholder="Nama Penuh" defaultValue={user.name} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Emel (Pilihan)</Label>
        <Input id="email" name="email" type="email" placeholder="contoh@emel.com" defaultValue={user.email || ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">No. Telefon (WhatsApp)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="0123456789" defaultValue={user.phone} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icNumber">Nombor IC (Pilihan)</Label>
          <Input id="icNumber" name="icNumber" placeholder="Contoh: 800101-01-1234" defaultValue={user.icNumber || ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Jantina (Pilihan)</Label>
          <Select name="gender" defaultValue={user.gender || ''}>
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
        <Select name="religion" defaultValue={user.religion || ''}>
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
        <Label htmlFor="password">Kata Laluan Baru (Biarkan kosong jika tidak mahu tukar)</Label>
        <Input id="password" name="password" type="password" placeholder="******" />
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

      <div className="space-y-4 border-t pt-4 mt-4">
        <h3 className="font-semibold text-lg">Maklumat Jawatankuasa (AJK)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="committeeType">Jenis Jawatankuasa</Label>
            <Select name="committeeType" defaultValue={user.committeeType || '_none'}>
              <SelectTrigger id="committeeType">
                <SelectValue placeholder="-- Tiada --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">-- Tiada --</SelectItem>
                <SelectItem value="JMB">AJK JMB</SelectItem>
                <SelectItem value="COMMUNITY">AJK Komuniti</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="committeePosition">Jawatan (Cth: Pengerusi)</Label>
            <Input id="committeePosition" name="committeePosition" defaultValue={user.committeePosition || ''} placeholder="Contoh: Pengerusi, Setiausaha" />
          </div>
        </div>
      </div>

      {role === 'OWNER' && (
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="font-semibold text-lg">Maklumat Pemilik</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handoverDate">Tarikh Terima Kunci (Handover Date)</Label>
              <Input 
                id="handoverDate" 
                name="handoverDate" 
                type="date" 
                defaultValue={formatDate(user.handoverDate)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snpDate">Tarikh S&P (S&P Date)</Label>
              <Input 
                id="snpDate" 
                name="snpDate" 
                type="date" 
                defaultValue={formatDate(user.snpDate)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="snpFile">Fail S&P (Muat naik untuk ganti)</Label>
            <Input id="snpFile" name="snpFile" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            {user.snpFile && (
              <p className="text-sm text-blue-600">
                <a href={user.snpFile} target="_blank" rel="noopener noreferrer">Lihat Fail Sedia Ada</a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileB">Borang B (Muat naik untuk ganti)</Label>
            <Input id="fileB" name="fileB" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            {user.fileB && (
              <p className="text-sm text-blue-600">
                <a href={user.fileB} target="_blank" rel="noopener noreferrer">Lihat Fail Sedia Ada</a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileC">Borang C (Muat naik untuk ganti)</Label>
            <Input id="fileC" name="fileC" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            {user.fileC && (
              <p className="text-sm text-blue-600">
                <a href={user.fileC} target="_blank" rel="noopener noreferrer">Lihat Fail Sedia Ada</a>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sedang Dikemaskini...' : 'Kemaskini Pengguna'}
        </Button>
      </div>
    </form>
  );
}
