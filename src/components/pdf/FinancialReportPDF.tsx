import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
  },
  col1: { width: '40%' },
  col2: { width: '30%', textAlign: 'right' },
  col3: { width: '30%', textAlign: 'right' },
  
  // Expense Table Cols
  expDate: { width: '15%' },
  expDesc: { width: '40%' },
  expCat: { width: '20%' },
  expFund: { width: '10%' },
  expAmount: { width: '15%', textAlign: 'right' },

  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
  },
});

interface FinancialReportPDFProps {
  data: {
    year: number;
    incomeByFund: any[];
    expenseByFund: any[];
    expenseByCategory: any[];
    expenses: any[];
    generatedAt: Date;
  };
}

export function FinancialReportPDF({ data }: FinancialReportPDFProps) {
  const { year, incomeByFund, expenseByFund, expenseByCategory, expenses, generatedAt } = data;

  const funds = incomeByFund.map(i => {
    const expense = expenseByFund.find(e => e.fundId === i.fundId);
    return {
      name: i.fundName,
      income: i.totalIncome,
      expense: expense?.totalExpense || 0,
      balance: i.totalIncome - (expense?.totalExpense || 0),
    };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>JMB Financial Report</Text>
          <Text style={styles.subtitle}>Year: {year} | Generated: {generatedAt.toLocaleDateString()}</Text>
        </View>

        {/* Fund Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fund Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.col1]}>Fund Name</Text>
              <Text style={[styles.tableCell, styles.col2]}>Total Income</Text>
              <Text style={[styles.tableCell, styles.col3]}>Total Expense</Text>
            </View>
            {funds.map((fund, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{fund.name}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{formatCurrency(fund.income)}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{formatCurrency(fund.expense)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown by Category</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '70%' }]}>Category</Text>
              <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>Amount</Text>
            </View>
            {expenseByCategory.map((cat, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '70%' }]}>{cat.categoryName}</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>{formatCurrency(cat.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Expenses List</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.expDate]}>Date</Text>
              <Text style={[styles.tableCell, styles.expDesc]}>Description</Text>
              <Text style={[styles.tableCell, styles.expCat]}>Category</Text>
              <Text style={[styles.tableCell, styles.expFund]}>Fund</Text>
              <Text style={[styles.tableCell, styles.expAmount]}>Amount</Text>
            </View>
            {expenses.map((exp, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.expDate]}>{new Date(exp.expenseDate).toLocaleDateString()}</Text>
                <Text style={[styles.tableCell, styles.expDesc]}>{exp.description}</Text>
                <Text style={[styles.tableCell, styles.expCat]}>{exp.category.name}</Text>
                <Text style={[styles.tableCell, styles.expFund]}>{exp.fund.name}</Text>
                <Text style={[styles.tableCell, styles.expAmount]}>{formatCurrency(exp.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
