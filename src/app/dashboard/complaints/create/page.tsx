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
import { createComplaint } from '@/lib/actions/complaints';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function CreateComplaintPage() {
  const [type, setType] = useState('');

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/complaints">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Cipta Aduan Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Butiran Aduan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createComplaint} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tajuk Aduan</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Contoh: Paip Bocor di Blok A" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Jenis Aduan</Label>
              <Select 
                name="type" 
                required 
                value={type}
                onValueChange={setType}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="-- Pilih Jenis Aduan --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">Umum (General)</SelectItem>
                  <SelectItem value="PARKING_UNIT">Parkir Unit</SelectItem>
                  <SelectItem value="PARKING_COMMON">Parkir Pelawat/Umum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'PARKING_COMMON' && (
              <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Perhatian: Parking Common</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Parking common adalah kemudahan bersama dan berasaskan "First come, first serve". 
                        Ia tidak dikhaskan untuk mana-mana unit tertentu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Keterangan Lanjut</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Sila nyatakan butiran aduan anda dengan jelas..."
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Hantar Aduan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
