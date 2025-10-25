import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { User, Transaction, Account, Budget, Investment, Category, ToastMessage, ChatMessage, TransactionType, AppState, Action } from '../types';
import { USERS, TRANSACTIONS, ACCOUNTS, BUDGETS, INVESTMENTS, CATEGORIES } from '../constants';

const LOCAL_STORAGE_KEY = 'mayo_finance_app_state';

const initialState: AppState = {
  users: USERS,
  transactions: TRANSACTIONS,
  accounts: ACCOUNTS,
  budgets: BUDGETS,
  investments: INVESTMENTS,
  categories: CATEGORIES,
  currentUser: 'user1',
  theme: 'light',
  toasts: [],
  aiChatHistory: [],
};

// Fungsi ini akan memuat state dari localStorage.
// Jika gagal, ia akan mengatur state awal.
const loadInitialState = (initial: AppState): AppState => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) {
            // Tidak ada state yang disimpan, periksa preferensi tema sistem untuk pemuatan pertama kali
             if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return { ...initial, theme: 'dark' };
            }
            return initial;
        }
        const loadedState = JSON.parse(serializedState);
        // Pastikan state sementara bersih saat dimuat.
        loadedState.toasts = []; 
        return loadedState;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return initial;
    }
};


const DataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const dataReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'ADD_TRANSACTION': {
        const newTransaction = action.payload;
        const updatedAccounts = state.accounts.map(acc => {
            if (newTransaction.type === TransactionType.Transfer) {
                if (acc.id === newTransaction.accountId) { // Akun Dari
                    return { ...acc, balance: acc.balance - newTransaction.amount };
                }
                if (acc.id === newTransaction.destinationAccountId) { // Akun Ke
                    return { ...acc, balance: acc.balance + newTransaction.amount };
                }
            } else if (acc.id === newTransaction.accountId) {
                const newBalance = newTransaction.type === TransactionType.Income 
                    ? acc.balance + newTransaction.amount 
                    : acc.balance - newTransaction.amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        });
        return { 
            ...state, 
            transactions: [newTransaction, ...state.transactions],
            accounts: updatedAccounts,
        };
    }
      
    case 'UPDATE_TRANSACTION': {
        const { oldTransaction, newTransaction } = action.payload;
        const updatedTransactions = state.transactions.map(t =>
          t.id === newTransaction.id ? newTransaction : t
        );
        
        const accountBalances = new Map<string, number>();
        state.accounts.forEach(acc => accountBalances.set(acc.id, acc.balance));

        // Kembalikan transaksi lama
        if (oldTransaction.type === TransactionType.Transfer) {
            accountBalances.set(oldTransaction.accountId, accountBalances.get(oldTransaction.accountId)! + oldTransaction.amount);
            accountBalances.set(oldTransaction.destinationAccountId!, accountBalances.get(oldTransaction.destinationAccountId!)! - oldTransaction.amount);
        } else if (oldTransaction.type === TransactionType.Income) {
            accountBalances.set(oldTransaction.accountId, accountBalances.get(oldTransaction.accountId)! - oldTransaction.amount);
        } else { // Pengeluaran
            accountBalances.set(oldTransaction.accountId, accountBalances.get(oldTransaction.accountId)! + oldTransaction.amount);
        }

        // Terapkan transaksi baru
        if (newTransaction.type === TransactionType.Transfer) {
            accountBalances.set(newTransaction.accountId, accountBalances.get(newTransaction.accountId)! - newTransaction.amount);
            accountBalances.set(newTransaction.destinationAccountId!, accountBalances.get(newTransaction.destinationAccountId!)! + newTransaction.amount);
        } else if (newTransaction.type === TransactionType.Income) {
            accountBalances.set(newTransaction.accountId, accountBalances.get(newTransaction.accountId)! + newTransaction.amount);
        } else { // Pengeluaran
            accountBalances.set(newTransaction.accountId, accountBalances.get(newTransaction.accountId)! - newTransaction.amount);
        }
        
        const updatedAccounts = state.accounts.map(acc => ({
            ...acc,
            balance: accountBalances.get(acc.id)!,
        }));

        return {
            ...state,
            transactions: updatedTransactions,
            accounts: updatedAccounts,
        };
    }

    case 'DELETE_TRANSACTION': {
        const transactionToDelete = action.payload;
        const updatedAccounts = state.accounts.map(acc => {
            if (transactionToDelete.type === TransactionType.Transfer) {
                if (acc.id === transactionToDelete.accountId) { // Akun Dari
                    return { ...acc, balance: acc.balance + transactionToDelete.amount };
                }
                if (acc.id === transactionToDelete.destinationAccountId) { // Akun Ke
                    return { ...acc, balance: acc.balance - transactionToDelete.amount };
                }
            } else if (acc.id === transactionToDelete.accountId) {
                const newBalance = transactionToDelete.type === TransactionType.Income
                    ? acc.balance - transactionToDelete.amount
                    : acc.balance + transactionToDelete.amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        });
        return {
            ...state,
            transactions: state.transactions.filter(t => t.id !== transactionToDelete.id),
            accounts: updatedAccounts,
        };
    }

    case 'UPDATE_USERS':
      return { ...state, users: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return { 
        ...state, 
        categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c)
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload)
      };
      
    case 'ADD_ACCOUNT':
        return { ...state, accounts: [...state.accounts, action.payload] };
  
    case 'UPDATE_ACCOUNT':
        return {
            ...state,
            accounts: state.accounts.map(acc => acc.id === action.payload.id ? action.payload : acc),
        };
  
    case 'DELETE_ACCOUNT':
        return {
            ...state,
            accounts: state.accounts.filter(acc => acc.id !== action.payload),
        };

    case 'TOGGLE_THEME':
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        return { ...state, theme: newTheme };

    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: new Date().getTime() }],
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
      
    case 'ADD_AI_CHAT_MESSAGE':
        return { ...state, aiChatHistory: [...state.aiChatHistory, action.payload] };

    case 'SET_AI_CHAT_HISTORY':
        return { ...state, aiChatHistory: action.payload };

    default:
      return state;
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState, loadInitialState);

  useEffect(() => {
    try {
        // Buat state yang dapat disimpan, tidak termasuk properti sementara seperti toast
        const stateToSave = { ...state, toasts: [] };
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (err) {
        console.error("Could not save state to localStorage", err);
    }
  }, [state]); // Efek ini berjalan setiap kali state berubah

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};