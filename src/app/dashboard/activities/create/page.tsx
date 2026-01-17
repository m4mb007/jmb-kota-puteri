'use client';

import Link from 'next/link';
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
import { ArrowLeft, CalendarRange } from 'lucide-react';
import { createActivity } from '@/lib/actions/activities';
import { useState, useEffect } from 'react';

interface UnitOption {
  id: string;
  unitNumber: string;
}

interface ApiUnit {
  id: string;
  unitNumber: string;
}

export default function CreateActivityPage() {
  const [units, setUnits] = useState<UnitOption[]>([]);

  useEffect(() => {
    async function loadUnits() {
      const res = await fetch('/api/v1/user/me');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.id) return;

      const apiUnits = (data.units || []) as ApiUnit[];
      const options: UnitOption[] = apiUnits.map((u) => ({
        id: u.id,
        unitNumber: u.unitNumber,
      }));
      setUnits(options);
    }

    loadUnits();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/activities">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Permohonan Aktiviti / Majlis</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Butiran Aktiviti</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createActivity} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tajuk Aktiviti</Label>
              <Input
                id="title"
                name="title"
                placeholder="Contoh: Majlis Rumah Terbuka Blok B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Tarikh Aktiviti</Label>
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <Input id="date" name="date" type="date" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi (contoh: Dewan, Kawasan Lapang)</Label>
              <Input
                id="location"
                name="location"
                placeholder="Contoh: Dewan Serbaguna Blok A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Unit Penganjur</Label>
              <Select name="unitId" defaultValue="_none">
                <SelectTrigger id="unitId">
                  <SelectValue placeholder="Pilih unit (jika berkaitan)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tiada / Umum</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan Aktiviti</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Nyatakan masa, anggaran peserta, dan keperluan khas (jika ada)."
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Hantar Permohonan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
