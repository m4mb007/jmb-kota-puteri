import { auth } from '@/auth';
import { getExpenses, getFunds, getIncomeCollections, getExpenseCategories } from '@/lib/actions/finance';
import { FinanceNav } from './finance-nav';
import { CreateExpenseDialog } from './create-expense-dialog';
import { CreateIncomeDialog } from './create-income-dialog';
import { ReportsTab } from './reports-tab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { ExpenseActions } from './expense-actions';

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await auth();
  if (!session?.user) {
     return <div>Unauthorized</div>;
  }
  
  const isManagement = ['SUPER_ADMIN', 'JMB', 'STAFF'].includes(session.user.role);

  if (!isManagement) {
    return <div>Unauthorized</div>;
  }

  const params = await searchParams;
  const tab = params?.tab || 'overview';

  const funds = await getFunds();
  const categories = await getExpenseCategories();

  // Helper to format date
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('ms-MY');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">JMB Finance</h1>
      </div>
      
      <FinanceNav />
      
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {funds.map((fund: any) => (
             <Card key={fund.id}>
               <CardHeader>
                 <CardTitle>{fund.name}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-3xl font-bold mb-4">
                   {formatCurrency(fund.balance)}
                 </div>
                 <div className="space-y-1 text-sm text-muted-foreground">
                   <div className="flex justify-between">
                      <span>Total Income:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(fund.totalIncome)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span>Total Expenses:</span>
                      <span className="text-red-600 font-medium">{formatCurrency(fund.totalExpense)}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
        </div>
      )}

      {tab === 'expenses' && (
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
             <CardTitle>Expenses</CardTitle>
             {isManagement && <CreateExpenseDialog categories={categories} funds={funds} />}
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Description</TableHead>
                   <TableHead>Category</TableHead>
                   <TableHead>Fund</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                   {isManagement && <TableHead>Actions</TableHead>}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {(await getExpenses()).map((expense: any) => (
                   <TableRow key={expense.id}>
                     <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                     <TableCell>
                        <div className="font-medium">{expense.description}</div>
                        {expense.attachmentUrl && (
                          <a href={expense.attachmentUrl} target="_blank" className="text-xs text-blue-500 hover:underline">View Receipt</a>
                        )}
                     </TableCell>
                     <TableCell>{expense.category.name}</TableCell>
                     <TableCell>{expense.fund.name}</TableCell>
                     <TableCell>{formatCurrency(expense.amount)}</TableCell>
                     <TableCell>
                       <span className={`px-2 py-1 rounded text-xs font-medium ${
                         expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                         expense.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                         'bg-yellow-100 text-yellow-800'
                       }`}>
                         {expense.status}
                       </span>
                     </TableCell>
                     {isManagement && (
                       <TableCell>
                         {expense.status === 'PENDING' && (
                           <ExpenseActions id={expense.id} />
                         )}
                       </TableCell>
                     )}
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
        </Card>
      )}

      {tab === 'income' && (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle>Income Collections</CardTitle>
               {isManagement && <CreateIncomeDialog funds={funds} />}
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Unit / Description</TableHead>
                     <TableHead>Fund</TableHead>
                     <TableHead>Source</TableHead>
                     <TableHead>Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                  {(await getIncomeCollections()).map((income: any) => (
                    <TableRow key={income.id}>
                      <TableCell>{formatDate(income.date)}</TableCell>
                       <TableCell>
                         {income.unit ? (
                           <span className="font-medium">{income.unit.unitNumber}</span>
                         ) : (
                           <span className="italic text-slate-500">{income.description || 'Pendapatan Lain'}</span>
                         )}
                       </TableCell>
                       <TableCell>{income.fund.name}</TableCell>
                       <TableCell>{income.source}</TableCell>
                       <TableCell>{formatCurrency(income.amount)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
         </Card>
      )}

      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}
