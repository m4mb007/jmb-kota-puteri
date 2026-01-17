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
  colTitle: {
    width: '30%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  colDate: {
    width: '18%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  colLocation: {
    width: '22%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  colUnit: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  colStatus: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  cell: {
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

interface ActivitiesReportPDFProps {
  activities: {
    title: string;
    description?: string | null;
    date: string;
    location?: string | null;
    status: string;
    unitNumber?: string | null;
    createdByName?: string | null;
  }[];
  filterLabel: string;
}

export function ActivitiesReportPDF({
  activities,
  filterLabel,
}: ActivitiesReportPDFProps) {
  const generatedAt = new Date().toLocaleDateString('ms-MY');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Aktiviti / Majlis</Text>
          <Text style={styles.subtitle}>
            Penapis: {filterLabel} | Dijana pada {generatedAt}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.colTitle}>
              <Text style={styles.cell}>Tajuk</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.cell}>Tarikh</Text>
            </View>
            <View style={styles.colLocation}>
              <Text style={styles.cell}>Lokasi</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={styles.cell}>Unit</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.cell}>Status</Text>
            </View>
          </View>

          {activities.map((activity, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colTitle}>
                <Text style={styles.cell}>{activity.title}</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.cell}>
                  {new Date(activity.date).toLocaleDateString('ms-MY')}
                </Text>
              </View>
              <View style={styles.colLocation}>
                <Text style={styles.cell}>
                  {activity.location || '-'}
                </Text>
              </View>
              <View style={styles.colUnit}>
                <Text style={styles.cell}>
                  {activity.unitNumber || '-'}
                </Text>
              </View>
              <View style={styles.colStatus}>
                <Text style={styles.cell}>{activity.status}</Text>
              </View>
            </View>
          ))}

          {activities.length === 0 && (
            <View style={styles.tableRow}>
              <View style={{ width: '100%', padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#999' }}>
                  Tiada aktiviti untuk penapis ini.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Laporan Aktiviti JMB Idaman Kota Puteri</Text>
        </View>
      </Page>
    </Document>
  );
}
