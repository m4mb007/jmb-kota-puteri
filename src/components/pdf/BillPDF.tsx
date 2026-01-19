import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register font (optional, using default Helvetica for now)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyAddress: {
    fontSize: 9,
    color: '#333333',
    marginTop: 2,
  },
  invoiceTitleBar: {
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    width: 80,
  },
  value: {
    fontSize: 9,
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
    borderColor: '#e0e0e0',
  }, 
  tableRow: { 
    margin: 'auto', 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 25,
    alignItems: 'center',
  }, 
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  colNo: { width: '8%', borderRightWidth: 1, borderColor: '#e0e0e0', padding: 4, textAlign: 'center' },
  colDesc: { width: '52%', borderRightWidth: 1, borderColor: '#e0e0e0', padding: 4 },
  colPrice: { width: '15%', borderRightWidth: 1, borderColor: '#e0e0e0', padding: 4, textAlign: 'right' },
  colUnit: { width: '10%', borderRightWidth: 1, borderColor: '#e0e0e0', padding: 4, textAlign: 'center' },
  colTotal: { width: '15%', borderRightWidth: 1, borderColor: '#e0e0e0', padding: 4, textAlign: 'right' },
  
  cellText: { fontSize: 9 },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f0f0f0',
    padding: 5,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e0e0e0',
  },
  warningText: {
    color: 'red',
    fontSize: 9,
    marginTop: 10,
    fontWeight: 'bold',
  },
  bankDetails: {
    marginTop: 15,
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bankLabel: {
    fontSize: 9,
    width: 120,
    fontWeight: 'bold',
  },
  bankValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

interface BillPDFProps {
  bill: {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: string;
    type: string;
    unit: {
      unitNumber: string;
      owner?: {
        name: string;
        email: string;
      } | null;
    };
    createdAt: Date;
  };
}

const MONTHS = [
  'JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN',
  'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER'
];

export const BillPDF = ({ bill }: BillPDFProps) => {
  const isSinking = bill.type === 'SINKING';
  const isMaintenance = bill.type === 'MAINTENANCE';
  // Legacy support: if maintenance but high amount, it might be combined
  const isCombined = isMaintenance && bill.amount >= 88;

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Placeholder for Logo */}
        {/* <Image src="/path/to/logo.png" style={styles.logo} /> */}
        <View style={styles.headerTextContainer}>
          <Text style={styles.companyName}>JMB IDAMAN KOTA PUTERI (3/2-1406/474)</Text>
          <Text style={styles.companyAddress}>Idaman Selangorku@Kota Puteri 1, Persiaran Kota Puteri 5, Seksyen 5,</Text>
          <Text style={styles.companyAddress}>48100 Gombak, Selangor, Malaysia</Text>
          <Text style={styles.companyAddress}>Tel: 0162236844</Text>
          <Text style={styles.companyAddress}>Email: jmbidamankotaputeri@gmail.com</Text>
        </View>
      </View>

      {/* Invoice Title Bar */}
      <View style={styles.invoiceTitleBar}>
        <Text style={styles.invoiceTitle}>Invois</Text>
      </View>

      {/* Info Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        {/* Left: Recipient */}
        <View style={{ width: '50%' }}>
          <Text style={[styles.label, { marginBottom: 2, fontWeight: 'bold' }]}>Invois Kepada :</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
            {bill.unit.owner?.name?.toUpperCase() || 'PEMILIK / PENGHUNI'}
          </Text>
          <Text style={{ fontSize: 9 }}>
            {bill.unit.unitNumber} IDAMAN PKNS SELANGORKU @ KOTA PUTERI 1
          </Text>
          <Text style={{ fontSize: 9 }}>PERSIARAN KOTA PUTERI 5</Text>
          <Text style={{ fontSize: 9 }}>SEKSYEN 5 KOTA PUTERI</Text>
          <Text style={{ fontSize: 9 }}>48100 BATU ARANG</Text>
          <Text style={{ fontSize: 9 }}>SELANGOR</Text>
          
          <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 10 }}>Unit No : {bill.unit.unitNumber}</Text>
        </View>

        {/* Right: Invoice Details */}
        <View style={{ width: '40%' }}>
          <View style={styles.row}>
            <Text style={styles.label}>Tarikh</Text>
            <Text style={styles.value}>: {new Date(bill.createdAt).toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>No. Invois</Text>
            <Text style={styles.value}>: {`IN-JMB-${bill.id.slice(-6).toUpperCase()}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Diproses Oleh</Text>
            <Text style={styles.value}>: SYSTEM</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rujukan</Text>
            <Text style={styles.value}>:</Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Perhatian Kepada :</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.colNo, styles.cellText, { fontWeight: 'bold' }]}>Bil</Text>
          <Text style={[styles.colDesc, styles.cellText, { fontWeight: 'bold' }]}>Keterangan</Text>
          <Text style={[styles.colPrice, styles.cellText, { fontWeight: 'bold' }]}>Harga (RM)</Text>
          <Text style={[styles.colUnit, styles.cellText, { fontWeight: 'bold' }]}>Unit</Text>
          <Text style={[styles.colTotal, styles.cellText, { fontWeight: 'bold' }]}>Jumlah (RM)</Text>
        </View>

        {/* Rows */}
        {/* Sinking Fund */}
        {(isSinking || isCombined) && (
          <View style={styles.tableRow}>
            <Text style={[styles.colNo, styles.cellText]}>1</Text>
            <Text style={[styles.colDesc, styles.cellText]}>SINKING FUND {MONTHS[bill.month - 1]}</Text>
            <Text style={[styles.colPrice, styles.cellText]}>
              {isCombined ? '8.00' : bill.amount.toFixed(2)}
            </Text>
            <Text style={[styles.colUnit, styles.cellText]}>1</Text>
            <Text style={[styles.colTotal, styles.cellText]}>
              {isCombined ? '8.00' : bill.amount.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Maintenance Fee */}
        {(isMaintenance) && (
          <View style={styles.tableRow}>
            <Text style={[styles.colNo, styles.cellText]}>{isCombined ? '2' : '1'}</Text>
            <Text style={[styles.colDesc, styles.cellText]}>WANG PENYELENGGARAAN {MONTHS[bill.month - 1]}</Text>
            <Text style={[styles.colPrice, styles.cellText]}>
              {isCombined ? '80.00' : bill.amount.toFixed(2)}
            </Text>
            <Text style={[styles.colUnit, styles.cellText]}>1</Text>
            <Text style={[styles.colTotal, styles.cellText]}>
              {isCombined ? '80.00' : bill.amount.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={[styles.cellText, { fontWeight: 'bold', marginRight: 20 }]}>Jumlah Keseluruhan</Text>
        <Text style={[styles.cellText, { fontWeight: 'bold', width: '15%', textAlign: 'right' }]}>{bill.amount.toFixed(2)}</Text>
      </View>

      {/* Warning Text */}
      <Text style={styles.warningText}>
        SILA JELASKAN BAYARAN SEBELUM 30 HARIBULAN SETIAP BULAN UNTUK MENGELAKKAN DENDA CAJ LEWAT
      </Text>

      {/* Bank Details */}
      <View style={styles.bankDetails}>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>NAMA BANK</Text>
          <Text style={styles.bankValue}>: BANK RAKYAT</Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>NAMA AKAUN</Text>
          <Text style={styles.bankValue}>: JMB IDAMAN KOTA PUTERI</Text>
        </View>
        <View style={styles.bankRow}>
          <Text style={styles.bankLabel}>NOMBOR AKAUN</Text>
          <Text style={styles.bankValue}>: 113951005457 (LAMA) / 1101536348 (BARU)</Text>
        </View>
      </View>
    </Page>
  </Document>
);
};
