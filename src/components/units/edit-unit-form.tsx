
'use client';

import { useState } from 'react';
import { updateUnit } from '@/lib/actions/units';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditUnitFormProps {
  unit: any;
  users: any[];
}

export default function EditUnitForm({ unit, users }: EditUnitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const ownerId = formData.get('ownerId') as string;
    const manualArrearsRaw = formData.get('manualArrearsAmount') as string;

    if (ownerId && ownerId !== '_none') {
      const owner = users.find((u) => u.id === ownerId);
      if (owner && !owner.handoverDate) {
        alert('Tarikh terima kunci belum dimasukkan. Sila kemaskini profil pemilik dahulu.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (manualArrearsRaw && Number.isNaN(Number(manualArrearsRaw))) {
        alert('Nilai tunggakan tidak sah. Sila masukkan nombor sahaja.');
        setIsSubmitting(false);
        return;
      }

      await updateUnit(unit.id, formData);
    } catch (error: any) {
      alert(error.message || 'Gagal mengemaskini unit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
        <Label>Nombor Unit</Label>
        <div className="p-2 border rounded-md bg-slate-50 text-slate-500">
          {unit.unitNumber} ({unit.type})
        </div>
        </div>

        <div className="space-y-2">
        <Label>Parking Aksesori</Label>
        <div className="flex gap-2">
          {unit.parkings.length > 0 ? (
            unit.parkings.map((p: any) => (
              <div key={p.id} className="p-2 border rounded-md bg-slate-50 text-slate-500 font-mono text-sm">
                {p.number}
              </div>
            ))
          ) : (
            <span className="text-sm text-slate-500 italic">Tiada parking aksesori.</span>
          )}
        </div>
        </div>

        <div className="space-y-2">
        <Label htmlFor="ownerId">Pemilik (Owner)</Label>
        <Select name="ownerId" defaultValue={unit.ownerId || '_none'}>
          <SelectTrigger id="ownerId">
            <SelectValue placeholder="-- Pilih Pemilik --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">-- Tiada --</SelectItem>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>

        <div className="space-y-2">
        <Label htmlFor="tenantId">Penyewa (Tenant)</Label>
        <Select name="tenantId" defaultValue={unit.tenantId || '_none'}>
          <SelectTrigger id="tenantId">
            <SelectValue placeholder="-- Pilih Penyewa --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">-- Tiada --</SelectItem>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Biarkan kosong jika unit tidak disewa.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manualArrearsAmount">Tunggakan Sedia Ada (RM)</Label>
        <Input
          id="manualArrearsAmount"
          name="manualArrearsAmount"
          type="number"
          step="0.01"
          defaultValue={unit.manualArrearsAmount ?? 0}
        />
        <p className="text-xs text-slate-500">
          Contoh: jumlah tunggakan sebelum sistem (contoh 12 bulan tidak bayar).
        </p>
        </div>

      <div className="space-y-2">
        <Label htmlFor="monthlyAdjustmentAmount">Pelarasan Bulanan (RM)</Label>
        <Input
          id="monthlyAdjustmentAmount"
          name="monthlyAdjustmentAmount"
          type="number"
          step="0.01"
          defaultValue={unit.monthlyAdjustmentAmount ?? 0}
        />
        <p className="text-xs text-slate-500">
          Jumlah pelarasan yang akan ditambah pada setiap bil bulanan. Contoh: Unit A minta RM 40 + bulan semasa, masukkan 40.00. Bil akan dikira sebagai: Jumlah Asas + Pelarasan.
        </p>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sedang Disimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
