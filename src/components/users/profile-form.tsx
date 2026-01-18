
'use client';

import { updateProfile } from '@/lib/actions/users';
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

interface ProfileFormProps {
  user: any;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      const hasPasswordChange = formData.get('newPassword');
      const successMessage = hasPasswordChange 
        ? 'Profil dan kata laluan berjaya dikemaskini' 
        : 'Profil berjaya dikemaskini';
      toast.success(successMessage);
      // Clear password fields after successful update
      const form = document.querySelector('form');
      if (form) {
        const passwordFields = ['currentPassword', 'newPassword', 'confirmPassword'];
        passwordFields.forEach(fieldName => {
          const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
          if (field) field.value = '';
        });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal mengemaskini profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Penuh</Label>
        <Input id="name" name="name" defaultValue={user.name} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Emel</Label>
        <Input id="email" name="email" type="email" defaultValue={user.email || ''} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">No. Telefon (WhatsApp)</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={user.phone || ''} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icNumber">Nombor IC</Label>
          <Input id="icNumber" name="icNumber" defaultValue={user.icNumber || ''} placeholder="Contoh: 800101-01-1234" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Jantina</Label>
          <Select name="gender" defaultValue={user.gender || undefined}>
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
        <Label htmlFor="religion">Agama</Label>
        <Select name="religion" defaultValue={user.religion || undefined}>
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

      <div className="space-y-4 border-t pt-4 mt-4">
        <h3 className="font-semibold text-lg">Tukar Kata Laluan</h3>
        <p className="text-sm text-muted-foreground">
          Biarkan kosong jika tidak mahu menukar kata laluan.
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Kata Laluan Semasa</Label>
          <Input 
            id="currentPassword" 
            name="currentPassword" 
            type="password" 
            placeholder="Masukkan kata laluan semasa"
            autoComplete="current-password"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Kata Laluan Baru</Label>
            <Input 
              id="newPassword" 
              name="newPassword" 
              type="password" 
              placeholder="Min. 6 aksara"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Sahkan Kata Laluan Baru</Label>
            <Input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              placeholder="Masukkan semula"
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      {user.role === 'OWNER' && (
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="font-semibold text-lg">Maklumat Pemilik</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="handoverDate">Tarikh Serah Kunci</Label>
              <Input 
                id="handoverDate" 
                name="handoverDate" 
                type="date" 
                defaultValue={user.handoverDate ? user.handoverDate.split('T')[0] : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snpDate">Tarikh Sign SNP</Label>
              <Input 
                id="snpDate" 
                name="snpDate" 
                type="date" 
                defaultValue={user.snpDate ? user.snpDate.split('T')[0] : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="snpFile">Muat Naik SNP (Muka Depan)</Label>
            {user.snpFile && (
              <div className="text-sm text-green-600 mb-1">Fail sedia ada: <a href={user.snpFile} target="_blank" className="underline">Lihat</a></div>
            )}
            <Input id="snpFile" name="snpFile" type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileB">Muat Naik Fail B</Label>
            {user.fileB && (
              <div className="text-sm text-green-600 mb-1">Fail sedia ada: <a href={user.fileB} target="_blank" className="underline">Lihat</a></div>
            )}
            <Input id="fileB" name="fileB" type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileC">Muat Naik Fail C</Label>
            {user.fileC && (
              <div className="text-sm text-green-600 mb-1">Fail sedia ada: <a href={user.fileC} target="_blank" className="underline">Lihat</a></div>
            )}
            <Input id="fileC" name="fileC" type="file" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sedang Disimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
