'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createAGM } from '@/lib/actions/agm';

export function CreateAGMForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resolutions, setResolutions] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' },
  ]);

  const addResolution = () => {
    setResolutions([...resolutions, { title: '', description: '' }]);
  };

  const removeResolution = (index: number) => {
    setResolutions(resolutions.filter((_, i) => i !== index));
  };

  const updateResolution = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...resolutions];
    updated[index][field] = value;
    setResolutions(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add resolutions to form data
      resolutions.forEach((res, i) => {
        formData.append(`resolution_${i}_title`, res.title);
        formData.append(`resolution_${i}_description`, res.description);
      });

      await createAGM(formData);
      alert('AGM berjaya dicipta!');
      router.push('/dashboard/agm');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ralat mencipta AGM');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Maklumat AGM</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Tajuk AGM *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Contoh: Mesyuarat Agung Tahunan 2026"
            />
          </div>

          <div>
            <Label htmlFor="description">Penerangan</Label>
            <textarea
              id="description"
              name="description"
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Penerangan ringkas mengenai AGM"
            />
          </div>

          <div>
            <Label htmlFor="meetingDate">Tarikh Mesyuarat *</Label>
            <Input
              id="meetingDate"
              name="meetingDate"
              type="datetime-local"
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="w-full border rounded-md p-2"
            >
              <option value="DRAFT">Draf</option>
              <option value="ACTIVE">Aktif</option>
              <option value="CLOSED">Ditutup</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Resolusi</h2>
          <Button type="button" onClick={addResolution} variant="outline" size="sm">
            + Tambah Resolusi
          </Button>
        </div>

        <div className="space-y-4">
          {resolutions.map((res, index) => (
            <div key={index} className="border rounded-lg p-4 relative">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">Resolusi {index + 1}</h3>
                {resolutions.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeResolution(index)}
                  >
                    Padam
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Tajuk Resolusi *</Label>
                  <Input
                    value={res.title}
                    onChange={(e) => updateResolution(index, 'title', e.target.value)}
                    placeholder="Contoh: Kelulusan Penyata Kewangan Tahunan"
                    required
                  />
                </div>

                <div>
                  <Label>Penerangan</Label>
                  <textarea
                    value={res.description}
                    onChange={(e) => updateResolution(index, 'description', e.target.value)}
                    className="w-full border rounded-md p-2"
                    rows={2}
                    placeholder="Penerangan lanjut mengenai resolusi"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Cipta AGM'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}

