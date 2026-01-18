'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Vote } from 'lucide-react';
import { setVotingEligibilityOverride } from '@/lib/actions/agm';
import { useRouter } from 'next/navigation';

interface VotingEligibilityCardProps {
  user: {
    id: string;
    name: string;
    votingEligibilityOverride: boolean | null;
    votingEligibilityReason: string | null;
    votingEligibilitySetAt: Date | null;
  };
  systemEligible: boolean;
  arrearsAmount: number;
  isJMB: boolean;
}

export function VotingEligibilityCard({ 
  user, 
  systemEligible, 
  arrearsAmount,
  isJMB 
}: VotingEligibilityCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');

  const hasOverride = user.votingEligibilityOverride !== null;
  const currentStatus = hasOverride 
    ? user.votingEligibilityOverride 
    : systemEligible;

  const handleSetEligibility = async (eligible: boolean | null) => {
    if (eligible !== null && !reason.trim()) {
      alert('Sila masukkan sebab untuk perubahan ini');
      return;
    }

    if (eligible !== null) {
      const action = eligible ? 'LAYAK' : 'TIDAK LAYAK';
      if (!confirm(`Tetapkan pengguna sebagai ${action} mengundi?\n\nSebab: ${reason}`)) {
        return;
      }
    } else {
      if (!confirm('Reset kelayakan kepada tetapan sistem (berdasarkan tunggakan)?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await setVotingEligibilityOverride(user.id, eligible, reason || undefined);
      alert('Kelayakan undi telah dikemaskini');
      setShowForm(false);
      setReason('');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Ralat mengemas kini kelayakan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" /> Kelayakan Undi AGM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Semasa:</span>
            {currentStatus ? (
              <Badge className="bg-green-500">✓ Layak Mengundi</Badge>
            ) : (
              <Badge className="bg-red-500">✗ Tidak Layak</Badge>
            )}
          </div>

          {hasOverride ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">TETAPAN MANUAL JMB</Badge>
              </div>
              <p className="text-sm text-blue-900">
                <strong>Sebab:</strong> {user.votingEligibilityReason}
              </p>
              {user.votingEligibilitySetAt && (
                <p className="text-xs text-blue-700">
                  Ditetapkan pada: {new Date(user.votingEligibilitySetAt).toLocaleDateString('ms-MY', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Tetapan Sistem (Automatik)</strong>
              </p>
              {arrearsAmount > 0 ? (
                <p className="text-sm text-red-600 mt-1">
                  Tunggakan: RM {arrearsAmount.toFixed(2)}
                </p>
              ) : (
                <p className="text-sm text-green-600 mt-1">
                  Tiada tunggakan
                </p>
              )}
            </div>
          )}
        </div>

        {/* JMB Controls */}
        {isJMB && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Kawalan JMB</h4>
            
            {!showForm ? (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {hasOverride ? 'Tukar Tetapan Manual' : 'Tetapkan Secara Manual'}
                </Button>
                {hasOverride && (
                  <Button
                    onClick={() => handleSetEligibility(null)}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={loading}
                  >
                    Reset ke Tetapan Sistem
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <Label htmlFor="reason">Sebab Perubahan *</Label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mt-1 border rounded-md p-2 text-sm"
                    rows={3}
                    placeholder="Contoh: Mengikut pelan ansuran bulanan RM500. Disiplin dengan bayaran selama 3 bulan berturut-turut."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleSetEligibility(true)}
                    disabled={loading || !reason.trim()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Memproses...' : '✓ Layak'}
                  </Button>
                  <Button
                    onClick={() => handleSetEligibility(false)}
                    disabled={loading || !reason.trim()}
                    size="sm"
                    variant="destructive"
                  >
                    {loading ? 'Memproses...' : '✗ Tidak Layak'}
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setShowForm(false);
                    setReason('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={loading}
                >
                  Batal
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-2">
              <strong>Nota:</strong> Tetapan manual JMB akan mengatasi peraturan sistem (tunggakan).
              Gunakan dengan bijak untuk kes khas seperti pemilik yang mengikut pelan ansuran dengan disiplin.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

