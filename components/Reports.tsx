import React, { useMemo, useState } from 'react';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ReportsIcon } from './icons/IconComponents';

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

const Reports: React.FC = () => {
  const { state } = useData();
  const { transactions, currentUser } = state;
  const [timeframe, setTimeframe] = useState(6); // Default to 6 months

  const filteredData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - timeframe);
    
    const userTransactions = transactions.filter(t => 
      (currentUser === 'All' || t.userId === currentUser) &&
      new Date(t.date) >= startDate
    );

    const dataByMonth: { [key: string]: { income: number, expense: number, net: number } } = {};

    userTransactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, expense: 0, net: 0 };
      }
      if (t.type === TransactionType.Income) dataByMonth[month].income += t.amount;
      if (t.type === TransactionType.Expense) dataByMonth[month].expense += t.amount;
    });

    Object.values(dataByMonth).forEach(monthData => {
        monthData.net = monthData.income - monthData.expense;
    });

    // Create a list of all months in the timeframe for correct sorting
    const allMonths: {month: string, income: number, expense: number, net: number}[] = [];
// FIX: Corrected the loop for generating past months to be more robust and avoid date overflow issues.
    for(let i=0; i<timeframe; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        allMonths.push({
            month: monthName,
            income: dataByMonth[monthName]?.income || 0,
            expense: dataByMonth[monthName]?.expense || 0,
            net: dataByMonth[monthName]?.net || 0,
        });
    }

    const cashFlow = allMonths.reverse();

    // FIX: Replaced reduce with forEach to avoid potential type inference issues with the accumulator,
    // which could lead to amounts being treated as non-numbers.
    const expenseByCategory: { [key: string]: number } = {};
    userTransactions
      .filter(t => t.type === TransactionType.Expense)
      .forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });

    const expenseBreakdown = Object.entries(expenseByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
      
    return { cashFlow, expenseBreakdown };
  }, [transactions, currentUser, timeframe]);

  return (
    <>
      <FeatureHeader
        icon={<ReportsIcon />}
        title="Financial Reports"
        subtitle="Analyze your financial trends and breakdowns."
      >
        <select
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="block pl-3 pr-8 py-2 text-base bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
        </select>
      </FeatureHeader>

      <div className="space-y-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredData.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tick={{ fill: 'rgb(100 116 139)' }} />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: 'rgb(100 116 139)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Savings" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredData.expenseBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: 'rgb(100 116 139)' }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'rgb(100 116 139)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" name="Total Spent" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
};

export default Reports;