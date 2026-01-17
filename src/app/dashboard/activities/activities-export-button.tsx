'use client';

import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ActivitiesReportPDF } from '@/components/pdf/ActivitiesReportPDF';

interface ActivitiesExportButtonProps {
  activities: {
    id: string;
    title: string;
    description: string;
    date: Date | string;
    location: string | null;
    status: string;
    unit: { unitNumber: string } | null;
    createdBy: { name: string | null };
  }[];
  statusFilter?: string;
}

export function ActivitiesExportButton({
  activities,
  statusFilter,
}: ActivitiesExportButtonProps) {
  const serializedActivities = activities.map((activity) => ({
    title: activity.title,
    description: activity.description,
    date:
      typeof activity.date === 'string'
        ? activity.date
        : activity.date.toISOString(),
    location: activity.location,
    status: activity.status,
    unitNumber: activity.unit?.unitNumber ?? null,
    createdByName: activity.createdBy?.name ?? null,
  }));

  let filterLabel = 'Semua status';
  if (statusFilter === 'PENDING') filterLabel = 'Menunggu kelulusan';
  if (statusFilter === 'APPROVED') filterLabel = 'Diluluskan';
  if (statusFilter === 'REJECTED') filterLabel = 'Ditolak';
  if (statusFilter === 'CANCELLED') filterLabel = 'Dibatalkan';

  const fileNameSuffix = statusFilter ? `-${statusFilter}` : '-SEMUA';
  const fileName = `Laporan-Aktiviti${fileNameSuffix}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ActivitiesReportPDF
          activities={serializedActivities}
          filterLabel={filterLabel}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Export PDF
        </Button>
      )}
    </PDFDownloadLink>
  );
}

