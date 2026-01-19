'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFinancialReport } from '@/lib/actions/reports';
import { Loader2, FileDown, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FinancialReportPDF } from '@/components/pdf/FinancialReportPDF';

interface FundReport {
  fundId: string;
  fundName: string;
  totalIncome: number;
}

interface FundExpenseReport {
  fundId: string;
  fundName: string;
  totalExpense: number;
}

interface CategoryExpenseReport {
  categoryName: string;
  total: number;
}

interface FinancialReportData {
  year: number;
  incomeByFund: FundReport[];
  expenseByFund: FundExpenseReport[];
  expenseByCategory: CategoryExpenseReport[];
  expenses: {
    expenseDate: Date | string;
    description: string;
    category: { name: string };
    fund: { name: string };
    amount: number;
  }[];
  generatedAt: Date | string;
}

export function ReportsTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(currentYear.toString());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await getFinancialReport(parseInt(year));
      // Ensure description is not null (type compatibility fix)
      const safeData = {
        ...data,
        expenses: data.expenses.map(e => ({
          ...e,
          description: e.description || ''
        }))
      };
      setReportData(safeData);
    } catch (error) {
      console.error(error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Financial Report (AGM/EGM)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 w-48">
              <label className="text-sm font-medium">Select Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map(i => (
                    <SelectItem key={i} value={(currentYear - i).toString()}>
                      {currentYear - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-end">
            <PDFDownloadLink
              document={<FinancialReportPDF data={reportData} />}
              fileName={`JMB-Report-${year}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading} variant="outline">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fund Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.incomeByFund.map((fund) => {
                     const expense = reportData.expenseByFund.find((e) => e.fundId === fund.fundId);
                     const balance = fund.totalIncome - (expense?.totalExpense || 0);
                     return (
                       <div key={fund.fundId} className="border-b pb-4 last:border-0 last:pb-0">
                         <h4 className="font-semibold text-lg">{fund.fundName}</h4>
                         <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                           <span className="text-muted-foreground">Income:</span>
                           <span className="text-right text-green-600 font-medium">{formatCurrency(fund.totalIncome)}</span>
                           <span className="text-muted-foreground">Expenses:</span>
                           <span className="text-right text-red-600 font-medium">{formatCurrency(expense?.totalExpense || 0)}</span>
                           <span className="text-muted-foreground font-bold">Net Balance:</span>
                           <span className="text-right font-bold">{formatCurrency(balance)}</span>
                         </div>
                       </div>
                     );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.expenseByCategory.map((cat, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                      <span>{cat.categoryName}</span>
                      <span className="font-medium">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                  {reportData.expenseByCategory.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No expenses recorded for this year.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
