

import { User, Category, TransactionType, Account, Transaction, Budget, Investment } from './types';

export const USERS: User[] = [
  { id: 'user1', name: 'Malvin' },
  { id: 'user2', name: 'Yovita' },
];

export const CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Gaji', type: TransactionType.Income },
  { id: 'cat2', name: 'Bonus', type: TransactionType.Income },
  { id: 'cat3', name: 'Kebutuhan', type: TransactionType.Expense },
  { id: 'cat4', name: 'Transportasi', type: TransactionType.Expense },
  { id: 'cat5', name: 'Hiburan', type: TransactionType.Expense },
  { id: 'cat6', name: 'Makanan & Minuman', type: TransactionType.Expense },
  { id: 'cat7', name: 'Tagihan', type: TransactionType.Expense },
  { id: 'cat8', name: 'Pendidikan', type: TransactionType.Expense },
];

export const ACCOUNTS: Account[] = [
  { id: 'acc1', userId: 'user1', name: 'BCA Savings', type: 'Bank', balance: 50000000 },
  { id: 'acc2', userId: 'user1', name: 'Gopay', type: 'E-Wallet', balance: 1500000 },
  { id: 'acc3', userId: 'user2', name: 'Mandiri Savings', type: 'Bank', balance: 75000000 },
  { id: 'acc4', userId: 'user2', name: 'Cash', type: 'Cash', balance: 500000 },
];

// Helper to get a date in the current month
const getDateInCurrentMonth = (day: number) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), day).toISOString();
};

// Helper to get a date in the previous month
const getDateInPreviousMonth = (day: number) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, day).toISOString();
};


export const TRANSACTIONS: Transaction[] = [
  { id: 'txn1', userId: 'user1', accountId: 'acc1', type: TransactionType.Income, category: 'Gaji', amount: 15000000, description: 'Gaji Bulanan', date: getDateInCurrentMonth(1), tags: ['gaji'] },
  { id: 'txn2', userId: 'user2', accountId: 'acc3', type: TransactionType.Income, category: 'Gaji', amount: 20000000, description: 'Gaji Bulanan', date: getDateInCurrentMonth(1), tags: ['gaji'] },
  { id: 'txn3', userId: 'user1', accountId: 'acc2', type: TransactionType.Expense, category: 'Kebutuhan', amount: 2500000, description: 'Belanja bulanan', date: getDateInCurrentMonth(5), tags: ['groceries'] },
  { id: 'txn4', userId: 'user1', accountId: 'acc1', type: TransactionType.Expense, category: 'Tagihan', amount: 1000000, description: 'Bayar listrik & internet', date: getDateInCurrentMonth(10), tags: ['bills'] },
  { id: 'txn5', userId: 'user2', accountId: 'acc4', type: TransactionType.Expense, category: 'Transportasi', amount: 750000, description: 'Bensin & tol', date: getDateInCurrentMonth(12), tags: ['transport'] },
  { id: 'txn6', userId: 'user2', accountId: 'acc3', type: TransactionType.Expense, category: 'Hiburan', amount: 500000, description: 'Nonton bioskop', date: getDateInCurrentMonth(15), tags: ['movie', 'leisure'] },
  // Last month data for trends
  { id: 'txn7', userId: 'user1', accountId: 'acc1', type: TransactionType.Income, category: 'Gaji', amount: 14500000, description: 'Gaji Bulan Lalu', date: getDateInPreviousMonth(1), tags: ['gaji'] },
  { id: 'txn8', userId: 'user1', accountId: 'acc2', type: TransactionType.Expense, category: 'Kebutuhan', amount: 2300000, description: 'Belanja bulanan lalu', date: getDateInPreviousMonth(5), tags: ['groceries'] },
];

export const BUDGETS: Budget[] = [
  { id: 'bud1', userId: 'user1', category: 'Kebutuhan', amount: 3000000, period: 'Monthly' },
  { id: 'bud2', userId: 'user1', category: 'Hiburan', amount: 1000000, period: 'Monthly' },
  { id: 'bud3', userId: 'user2', category: 'Makanan & Minuman', amount: 4000000, period: 'Monthly' },
];

export const INVESTMENTS: Investment[] = [
    { id: 'inv1', userId: 'user1', name: 'BBCA Stock', type: 'Stock', quantity: 100, purchasePrice: 9000, currentPrice: 9500 },
    { id: 'inv2', userId: 'user1', name: 'Bitcoin', type: 'Crypto', quantity: 0.01, purchasePrice: 800000000, currentPrice: 1000000000 },
    { id: 'inv3', userId: 'user2', name: 'BNI Mutual Fund', type: 'Mutual Fund', quantity: 5000, purchasePrice: 1500, currentPrice: 1550 },
];