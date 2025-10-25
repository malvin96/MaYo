import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { formatCurrency } from '../utils/helpers';
import { TransactionType } from '../types';
import { BudgetsIcon } from './icons/IconComponents';

const Budget: React.FC = () => {
  const { state } = useData();
  const { budgets, transactions, currentUser } = state;

  const filteredBudgets = useMemo(() => {
    const userBudgets = budgets.filter(b => currentUser === 'All' || b.userId === currentUser);
    
    return userBudgets.map(budget => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const spent = transactions
        .filter(t =>
          (currentUser === 'All' || t.userId === budget.userId) &&
          t.type === TransactionType.Expense &&
          t.category === budget.category &&
          new Date(t.date) >= startOfMonth
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return { ...budget, spent, remaining, percentage };
    });
  }, [budgets, transactions, currentUser]);

  return (
    <>
      <FeatureHeader
        icon={<BudgetsIcon />}
        title="Budgets"
        subtitle="Track your spending against your monthly goals."
      />
      <div className="space-y-6">
        {filteredBudgets.map(budget => (
          <Card key={budget.id}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{budget.category}</h3>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{formatCurrency(budget.amount)} / month</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
              <span>Spent: {formatCurrency(budget.spent)}</span>
              <span>Remaining: {formatCurrency(budget.remaining)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${budget.percentage > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              ></div>
            </div>
            {budget.percentage > 100 && (
              <p className="text-red-500 text-sm mt-1 font-semibold">
                Overspent by {formatCurrency(Math.abs(budget.remaining))}!
              </p>
            )}
          </Card>
        ))}
        {filteredBudgets.length === 0 && (
          <Card>
            <p className="text-center text-slate-500 dark:text-slate-400">No budgets set for this user.</p>
          </Card>
        )}
      </div>
    </>
  );
};

export default Budget;