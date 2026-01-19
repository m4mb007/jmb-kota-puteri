'use client';

import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MonthlyReportPDF } from '@/components/pdf/MonthlyReportPDF';
import { Prisma } from '@prisma/client';

type BillWithUnit = Prisma.BillGetPayload<{
  include: { unit: { include: { owner: true } } };
}>;

export function MonthlyReportButton({ bills }: { bills: BillWithUnit[] }) {
  const [isClient, setIsClient] = useState(false);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<MonthlyReportPDF bills={bills} month={month} year={year} />}
      fileName={`Laporan-Kewangan-${month}-${year}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Laporan Bulanan
        </Button>
      )}
    </PDFDownloadLink>
  );
}
