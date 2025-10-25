import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';
import Card from './common/Card';
import { formatCurrency } from '../utils/helpers';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon, DashboardIcon } from './icons/IconComponents';
import FeatureHeader from './common/FeatureHeader';
import DashboardEmptyState from './DashboardEmptyState';

interface DashboardProps {
  onAddTransaction: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <p className="label font-semibold text-slate-800 dark:text-slate-200">{`${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }} className="intro">{`${pld.name}: ${formatCurrency(pld.value)}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

const Dashboard: React.FC<DashboardProps> = ({ onAddTransaction }) => {
  const { state } = useData();
  const { transactions, accounts, investments, currentUser, users } = state;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => currentUser === 'All' || t.userId === currentUser);
  }, [transactions, currentUser]);
  
  const filteredInvestments = useMemo(() => {
    return investments.filter(i => currentUser === 'All' || i.userId === currentUser);
  }, [investments, currentUser]);

  const { totalIncome, totalExpense, totalBalance, totalInvestments, netWorth } = useMemo(() => {
    const userAccounts = accounts.filter(a => currentUser === 'All' || a.userId === currentUser);
    const totalBalance = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactionsThisMonth = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
    });

    const income = transactionsThisMonth
      .filter(t => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactionsThisMonth
      .filter(t => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalInvestmentsValue = filteredInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    
    return { 
        totalIncome: income, 
        totalExpense: expense, 
        totalBalance,
        totalInvestments: totalInvestmentsValue,
        netWorth: totalBalance + totalInvestmentsValue,
     };
  }, [filteredTransactions, accounts, filteredInvestments, currentUser]);

  const expenseByCategory = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.Expense)
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const monthlyTrend = useMemo(() => {
    const dataByMonth: { [key: string]: { income: number, expense: number } } = {};
    transactions.forEach(t => { // Use all transactions for trend
        const month = new Date(t.date).toISOString().slice(0, 7);
        if (!dataByMonth[month]) {
            dataByMonth[month] = { income: 0, expense: 0 };
        }
        if (t.type === TransactionType.Income) dataByMonth[month].income += t.amount;
        if (t.type === TransactionType.Expense) dataByMonth[month].expense += t.amount;
    });

    return Object.entries(dataByMonth)
        .map(([month, values]) => ({ month, ...values }))
        .sort((a,b) => a.month.localeCompare(b.month));

  }, [transactions]);
  
  const investmentTrend = useMemo(() => {
    if (filteredInvestments.length === 0) return [];

    const totalPurchaseValue = filteredInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    const totalCurrentValue = filteredInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);

    const months: { month: string, value: number }[] = [];
    const valueDifference = totalCurrentValue - totalPurchaseValue;

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        
        // Linear interpolation for demonstration
        const value = totalPurchaseValue + (valueDifference * ((5 - i) / 5.0));
        months.push({ month: monthName, value });
    }
    return months;
  }, [filteredInvestments]);

  if (filteredTransactions.length === 0) {
    const selectedUserName = currentUser === 'All' ? 'Malvin and Yovita' : users.find(u => u.id === currentUser)?.name;
    return <DashboardEmptyState userName={selectedUserName || ''} onAddTransaction={onAddTransaction} />;
  }

  return (
    <div className="space-y-6">
       <FeatureHeader
        icon={<DashboardIcon />}
        title="Dashboard"
        subtitle="Your financial overview and recent activity."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-full">
              <ArrowDownIcon className="w-6 h-6"/>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-80">Total Income (This Month)</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-400 to-red-600 text-white">
          <div className="flex items-center">
             <div className="p-3 bg-white/20 rounded-full">
              <ArrowUpIcon className="w-6 h-6"/>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-80">Total Expense (This Month)</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-80">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Expense Breakdown</h3>
          {expenseByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">No expense data available.</div>
          )}
        </Card>
        <Card className="lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Monthly Trends (All Users)</h3>
            {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" tick={{ fill: 'rgb(100 116 139)' }} />
                    <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: 'rgb(100 116 139)' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                </LineChart>
            </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">No transaction data for trends.</div>
             )}
        </Card>
      </div>
      
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Investment Value Trend</h3>
        {investmentTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={investmentTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tick={{ fill: 'rgb(100 116 139)' }} />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: 'rgb(100 116 139)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Portfolio Value" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">No investment data to display trend.</div>
        )}
      </Card>

    </div>
  );
};

export default Dashboard;