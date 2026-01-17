import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderRightWidth: 0, 
    borderBottomWidth: 0,
    marginTop: 10,
  }, 
  tableRow: { 
    margin: 'auto', 
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#eeeeee',
    fontWeight: 'bold',
  },
  tableCol: { 
    width: '15%', 
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0,
    padding: 5,
  },
  tableColWide: {
    width: '25%',
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0,
    padding: 5,
  },
  tableColAmount: { 
    width: '15%', 
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0,
    padding: 5,
    textAlign: 'right',
  }, 
  tableCell: { 
    margin: 'auto', 
    marginTop: 5, 
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  },
});

interface MonthlyReportPDFProps {
  bills: any[];
  month: number;
  year: number;
}

const MONTHS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export const MonthlyReportPDF = ({ bills, month, year }: MonthlyReportPDFProps) => {
  // Filter bills for the specific month/year
  const reportBills = bills.filter(b => b.month === month && b.year === year);
  
  const totalExpected = reportBills.reduce((sum, b) => sum + b.amount, 0);
  const totalCollected = reportBills
    .filter(b => b.status === 'APPROVED')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalOutstanding = totalExpected - totalCollected;
  
  const collectionRate = totalExpected > 0 
    ? ((totalCollected / totalExpected) * 100).toFixed(1) 
    : '0.0';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Kewangan Bulanan</Text>
          <Text style={styles.subtitle}>
            Bulan: {MONTHS[month - 1]} {year} | JMB Idaman Kota Puteri
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jumlah Unit Dibilkan</Text>
            <Text style={styles.summaryValue}>{reportBills.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jumlah Sepatutnya (RM)</Text>
            <Text style={styles.summaryValue}>{totalExpected.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Jumlah Kutipan (RM)</Text>
            <Text style={[styles.summaryValue, { color: 'green' }]}>{totalCollected.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Baki Tertunggak (RM)</Text>
            <Text style={[styles.summaryValue, { color: 'red' }]}>{totalOutstanding.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Kadar Kutipan</Text>
            <Text style={styles.summaryValue}>{collectionRate}%</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Unit</Text></View>
            <View style={styles.tableColWide}><Text style={styles.tableCell}>Pemilik</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Status</Text></View>
            <View style={styles.tableColAmount}><Text style={styles.tableCell}>Jumlah (RM)</Text></View>
            <View style={styles.tableColWide}><Text style={styles.tableCell}>Tarikh Kemaskini</Text></View>
          </View>

          {reportBills.map((bill, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{bill.unit.unitNumber}</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>{bill.unit.owner?.name || '-'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{bill.status}</Text>
              </View>
              <View style={styles.tableColAmount}>
                <Text style={styles.tableCell}>{bill.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>
                  {new Date(bill.updatedAt).toLocaleDateString('ms-MY')}
                </Text>
              </View>
            </View>
          ))}
          
          {reportBills.length === 0 && (
            <View style={styles.tableRow}>
              <View style={{ width: '100%', padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#999' }}>Tiada data untuk bulan ini.</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Laporan dijana pada {new Date().toLocaleDateString('ms-MY')}</Text>
        </View>
      </Page>
    </Document>
  );
};
