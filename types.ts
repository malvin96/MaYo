export enum TransactionType {
    Income = 'Income',
    Expense = 'Expense',
    Transfer = 'Transfer',
}

export interface User {
    id: string;
    name: string;
}

export interface Category {
    id:string;
    name: string;
    type: TransactionType;
}

export interface Account {
    id: string;
    userId: string;
    name: string;
    type: string; // 'Bank', 'E-Wallet', 'Cash', 'Investment'
    balance: number;
}

export interface Transaction {
    id: string;
    userId: string;
    accountId: string; // Akun sumber untuk semua jenis
    destinationAccountId?: string; // Akun tujuan untuk transfer
    type: TransactionType;
    category: string; // Akan menjadi 'Transfer' untuk transfer
    amount: number;
    description: string;
    date: string; // string ISO
    tags: string[];
}

export interface Budget {
    id: string;
    userId: string;
    category: string;
    amount: number;
    period: 'Monthly' | 'Yearly';
}

export interface Investment {
    id: string;
    userId: string;
    name: string;
    type: string; // 'Stock', 'Crypto', 'Mutual Fund'
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
}

export type View = 'Dashboard' | 'Transactions' | 'Accounts' | 'Budgets' | 'Investments' | 'Reports' | 'Health Check' | 'AI Assistant' | 'Settings';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    action?: {
        type: 'add_transaction' | 'update_transaction';
        payload: any;
    }
}

export interface AppState {
  users: User[];
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  investments: Investment[];
  categories: Category[];
  currentUser: string; // 'All' atau userId
  theme: 'light' | 'dark';
  toasts: ToastMessage[];
  aiChatHistory: ChatMessage[];
}

export type Action =
  | { type: 'SET_CURRENT_USER'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { oldTransaction: Transaction; newTransaction: Transaction } }
  | { type: 'DELETE_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_USERS'; payload: User[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_TOAST', payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST', payload: number }
  | { type: 'ADD_AI_CHAT_MESSAGE', payload: ChatMessage }
  | { type: 'SET_AI_CHAT_HISTORY', payload: ChatMessage[] };