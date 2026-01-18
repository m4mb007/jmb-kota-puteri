'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateAGMStatus, deleteAGM } from '@/lib/actions/agm';
import { useRouter } from 'next/navigation';

export function AGMActions({ agm }: { agm: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: 'DRAFT' | 'ACTIVE' | 'CLOSED') => {
    if (!confirm(`Tukar status kepada ${status}?`)) return;
    
    setLoading(true);
    try {
      await updateAGMStatus(agm.id, status);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ralat mengubah status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Padam AGM "${agm.title}"? Tindakan ini tidak boleh dibuat asal.`)) return;
    
    setLoading(true);
    try {
      await deleteAGM(agm.id);
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ralat memadam AGM');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {agm.status === 'DRAFT' && (
        <Button
          size="sm"
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={loading}
        >
          Aktifkan
        </Button>
      )}
      {agm.status === 'ACTIVE' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('CLOSED')}
          disabled={loading}
        >
          Tutup
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        Padam
      </Button>
    </div>
  );
}

