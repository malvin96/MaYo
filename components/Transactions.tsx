import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { EditIcon, DeleteIcon, TransactionsIcon } from './icons/IconComponents';
import { formatCurrency, formatDate, getUserNameById } from '../utils/helpers';
import { Transaction, TransactionType } from '../types';
import { exportToCsv, exportToPdf } from '../services/exportService';

interface TransactionsProps {
  onEditTransaction: (transaction: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ onEditTransaction }) => {
  const { state, dispatch } = useData();
  const { transactions, currentUser, users, accounts, categories } = state;

  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const accountNameMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
          const userMatch = currentUser === 'All' || t.userId === currentUser;
          const dateMatch = !dateFilter || t.date.startsWith(dateFilter);
          const categoryMatch = !categoryFilter || t.category === categoryFilter;
          return userMatch && dateMatch && categoryMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentUser, dateFilter, categoryFilter]);

  const handleDeleteTransaction = (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transaction });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction deleted', type: 'success' } });
    }
  };

  const handleExportCsv = () => {
    exportToCsv(filteredTransactions);
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Exported to CSV', type: 'info' } });
  }
  
  const handleExportPdf = () => {
    exportToPdf(filteredTransactions);
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Exported to PDF', type: 'info' } });
  }

  const getTransactionTypeIndicator = (type: TransactionType) => {
    switch (type) {
      case TransactionType.Income:
        return 'bg-green-500';
      case TransactionType.Expense:
        return 'bg-red-500';
      case TransactionType.Transfer:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const resetFilters = () => {
    setDateFilter('');
    setCategoryFilter('');
  }

  const uniqueCategories = useMemo(() => 
    categories
        .filter(c => c.type !== TransactionType.Transfer)
        .map(c => c.name)
        .sort(), 
    [categories]
  );
  const noTransactions = filteredTransactions.length === 0;

  return (
    <>
      <FeatureHeader
        icon={<TransactionsIcon />}
        title="Transactions"
        subtitle="View, manage, and export your transaction history."
      >
        <button 
            onClick={handleExportCsv} 
            disabled={noTransactions}
            className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Export CSV
        </button>
        <button 
            onClick={handleExportPdf} 
            disabled={noTransactions}
            className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Export PDF
        </button>
      </FeatureHeader>

      <Card>
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className='flex-grow'>
                <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700 dark:text-slate-300">Filter by Date</label>
                <input type="month" id="dateFilter" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm [color-scheme:dark]" />
            </div>
            <div className='flex-grow'>
                <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700 dark:text-slate-300">Filter by Category</label>
                <select id="categoryFilter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option value="">All Categories</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            {(dateFilter || categoryFilter) && (
                <div className="self-end">
                    <button onClick={resetFilters} className="bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-slate-600">Reset Filters</button>
                </div>
            )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <th className="py-3 px-2 sm:px-4">Transaction Details</th>
                <th className="py-3 px-2 sm:px-4 text-right">Amount</th>
                <th className="py-3 px-2 sm:px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex items-start">
                      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full mr-2 sm:mr-4 flex-shrink-0 ${getTransactionTypeIndicator(t.type)}`}></span>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-tight">{t.description}</div>
                        <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            {t.type === TransactionType.Transfer ? (
                              <span className="font-medium text-blue-600 dark:text-blue-400">Transfer</span>
                            ) : (
                              t.category
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {t.type === TransactionType.Transfer
                              ? `${accountNameMap.get(t.accountId)} → ${accountNameMap.get(t.destinationAccountId!)}`
                              : accountNameMap.get(t.accountId)
                            }
                            {currentUser === 'All' && t.type !== TransactionType.Transfer ? ` (${getUserNameById(users, t.userId)})` : ''}
                          </span>
                           <span>•</span>
                           <span>{formatDate(t.date)}</span>
                        </div>
                        {t.tags && t.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {t.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 px-1.5 py-0.5 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap text-sm sm:text-base ${
                      t.type === TransactionType.Income ? 'text-green-600' : 
                      t.type === TransactionType.Expense ? 'text-red-600' :
                      'text-slate-700 dark:text-slate-300'
                    }`}>
                    {t.type === TransactionType.Income ? '+' : t.type === TransactionType.Expense ? '-' : ''} {formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right">
                    <div className="flex items-center justify-end space-x-0 sm:space-x-1">
                        <button onClick={() => onEditTransaction(t)} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 p-1">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t)} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 p-1">
                          <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {noTransactions && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">No transactions found.</div>
          )}
        </div>
      </Card>
    </>
  );
};

export default Transactions;