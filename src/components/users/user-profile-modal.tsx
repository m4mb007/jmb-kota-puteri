'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getUserProfile } from "@/lib/actions/users";
import { Mail, Phone, User as UserIcon, Building2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Prisma } from "@prisma/client";

type UserWithUnits = Prisma.UserGetPayload<{
  include: {
    ownedUnits: {
      include: {
        lot: true,
      },
    },
    rentedUnits: {
      include: {
        lot: true,
      },
    },
  },
}>;

interface UserProfileModalProps {
  userId: string;
  name: string;
}

export function UserProfileModal({ userId, name }: UserProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<UserWithUnits | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !data) {
      setLoading(true);
      try {
        const user = await getUserProfile(userId);
        setData(user);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="hover:underline text-blue-600 font-medium text-left">
          {name}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil Pengguna</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4" /> Nama Penuh
                </div>
                <div className="text-lg font-semibold">{data.name}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Emel
                </div>
                <div>{data.email}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefon
                </div>
                <div>{data.phone || '-'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">IC Number</div>
                <div>{data.icNumber || '-'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Jantina</div>
                <div>{data.gender || '-'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Agama</div>
                <div>{data.religion || '-'}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Peranan</div>
                <div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                    {data.role}
                  </span>
                </div>
              </div>

              {data.role === 'OWNER' && (
                <>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Tarikh Serah Kunci</div>
                    <div>{data.handoverDate ? new Date(data.handoverDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Tarikh Sign SNP</div>
                    <div>{data.snpDate ? new Date(data.snpDate).toLocaleDateString() : '-'}</div>
                  </div>
                </>
              )}
            </div>

            {data.role === 'OWNER' && (
              <div className="border-b pb-6">
                <h3 className="text-base font-semibold mb-3">Dokumen</h3>
                <div className="grid grid-cols-1 gap-2">
                  {data.snpFile && (
                    <a href={data.snpFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Lihat SNP (Muka Depan)
                    </a>
                  )}
                  {data.fileB && (
                    <a href={data.fileB} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Lihat Fail B
                    </a>
                  )}
                  {data.fileC && (
                    <a href={data.fileC} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Lihat Fail C
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Unit Dimiliki ({data.ownedUnits.length})
                </h3>
                {data.ownedUnits.length > 0 ? (
                  <ul className="space-y-2">
                    {data.ownedUnits.map((unit) => (
                      <li key={unit.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium">{unit.unitNumber}</div>
                          <div className="text-xs text-muted-foreground">Lot {unit.lot?.lotNumber}</div>
                        </div>
                        <Link href={`/dashboard/units/${unit.id}`} onClick={() => setIsOpen(false)}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">Lihat</Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tiada unit dimiliki.</p>
                )}
              </div>

              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Unit Disewa ({data.rentedUnits.length})
                </h3>
                {data.rentedUnits.length > 0 ? (
                  <ul className="space-y-2">
                    {data.rentedUnits.map((unit) => (
                      <li key={unit.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium">{unit.unitNumber}</div>
                          <div className="text-xs text-muted-foreground">Lot {unit.lot?.lotNumber}</div>
                        </div>
                        <Link href={`/dashboard/units/${unit.id}`} onClick={() => setIsOpen(false)}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">Lihat</Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Tiada unit disewa.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Gagal memuatkan maklumat pengguna.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
