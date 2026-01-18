'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { castVote } from '@/lib/actions/agm';
import { useRouter } from 'next/navigation';

interface VotingFormProps {
  resolutionId: string;
  currentVote?: 'SETUJU' | 'TIDAK_SETUJU' | 'BERKECUALI';
}

export function VotingForm({ resolutionId, currentVote }: VotingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<'SETUJU' | 'TIDAK_SETUJU' | 'BERKECUALI'>(
    currentVote || 'SETUJU'
  );

  const handleVote = async () => {
    if (!confirm(`Sahkan undi anda: ${
      selectedChoice === 'SETUJU' ? 'Setuju' : 
      selectedChoice === 'TIDAK_SETUJU' ? 'Tidak Setuju' : 
      'Berkecuali'
    }?`)) {
      return;
    }

    setLoading(true);
    try {
      await castVote(resolutionId, selectedChoice);
      alert('Undi anda berjaya direkodkan!');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ralat mengundi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-4">
      <p className="text-sm font-medium mb-3">
        {currentVote ? 'Tukar undi anda:' : 'Pilih undi anda:'}
      </p>
      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => setSelectedChoice('SETUJU')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
            selectedChoice === 'SETUJU'
              ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          ✓ Setuju
        </button>
        <button
          type="button"
          onClick={() => setSelectedChoice('TIDAK_SETUJU')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
            selectedChoice === 'TIDAK_SETUJU'
              ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          ✗ Tidak Setuju
        </button>
        <button
          type="button"
          onClick={() => setSelectedChoice('BERKECUALI')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
            selectedChoice === 'BERKECUALI'
              ? 'border-gray-500 bg-gray-50 text-gray-700 font-semibold'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          ○ Berkecuali
        </button>
      </div>
      <Button
        onClick={handleVote}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Memproses...' : currentVote ? 'Tukar Undi' : 'Hantar Undi'}
      </Button>
    </div>
  );
}

