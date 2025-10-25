import React, { useState, useEffect, useCallback } from 'react';
import Modal from './common/Modal';
import { useData } from '../context/DataContext';
import { Transaction, TransactionType, Category, Account } from '../types';
import { generateId } from '../utils/helpers';
import { scanReceipt, suggestCategory } from '../services/geminiService';
import { CameraIcon } from './icons/IconComponents';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
  const { state, dispatch } = useData();
  const { categories, currentUser, users, accounts } = state;
  
  const getInitialUserId = () => {
    if (transaction) return transaction.userId;
    if (currentUser !== 'All') return currentUser;
    return users[0]?.id || '';
  };

  const [formData, setFormData] = useState({
    userId: getInitialUserId(),
    accountId: transaction?.accountId || '',
    destinationAccountId: transaction?.destinationAccountId || '',
    type: transaction?.type || TransactionType.Expense,
    amount: transaction?.amount || 0,
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    tags: transaction?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [categorySuggestion, setCategorySuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const expenseCategories = categories.filter(c => c.type === TransactionType.Expense);

  const resetForm = useCallback(() => {
      const initialUserId = getInitialUserId();
      const accountsForUser = accounts.filter(acc => acc.userId === initialUserId);
      
      setFormData({
        userId: initialUserId,
        accountId: transaction?.accountId || accountsForUser[0]?.id || '',
        destinationAccountId: transaction?.destinationAccountId || '',
        type: transaction?.type || TransactionType.Expense,
        amount: transaction?.amount || 0,
        category: transaction?.category || '',
        description: transaction?.description || '',
        date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
        tags: transaction?.tags || [],
      });
      setTagInput('');
      setScanError(null);
      setCategorySuggestion(null);
  }, [transaction, currentUser, users, accounts]);

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, resetForm]);
  
  useEffect(() => {
    // Only suggest for new expense transactions that are not being scanned
    if (transaction || formData.type !== TransactionType.Expense || isScanning) {
        setCategorySuggestion(null);
        return;
    }

    const handler = setTimeout(() => {
        if (formData.description.trim().length > 3 && formData.amount > 0) {
            const fetchSuggestion = async () => {
                setIsSuggesting(true);
                setCategorySuggestion(null); // Reset previous suggestion
                try {
                    const suggestion = await suggestCategory(
                        formData.description,
                        formData.amount,
                        expenseCategories
                    );
                    if (suggestion && suggestion !== formData.category) {
                        setCategorySuggestion(suggestion);
                    }
                } catch (error) {
                    console.error("Failed to fetch category suggestion:", error);
                } finally {
                    setIsSuggesting(false);
                }
            };
            fetchSuggestion();
        }
    }, 750); // Debounce for 750ms

    return () => {
        clearTimeout(handler);
    };
  }, [formData.description, formData.amount, formData.type, transaction, expenseCategories, isScanning]);


  useEffect(() => {
    const accountsForUser = accounts.filter(acc => acc.userId === formData.userId);
    setUserAccounts(accountsForUser);

    // If the currently selected account is not owned by the selected user,
    // reset it to the first available account for that user.
    if (!accountsForUser.some(acc => acc.id === formData.accountId)) {
        setFormData(prev => ({ ...prev, accountId: accountsForUser[0]?.id || '' }));
    }

    // Reset destination account if source account changes and they are the same
    if (formData.type === TransactionType.Transfer && formData.accountId === formData.destinationAccountId) {
        const otherAccount = accountsForUser.find(acc => acc.id !== formData.accountId);
        setFormData(prev => ({...prev, destinationAccountId: otherAccount?.id || ''}));
    }
  }, [formData.userId, accounts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({...prev, tags: [...prev.tags, newTag]}));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({...prev, tags: prev.tags.filter(tag => tag !== tagToRemove)}));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);
    setCategorySuggestion(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const result = await scanReceipt(base64String, file.type, expenseCategories);
        setFormData(prev => ({
          ...prev,
          amount: result.amount || prev.amount,
          category: result.category || prev.category,
          description: result.description || prev.description,
        }));
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Receipt scanned successfully!', type: 'success' } });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setScanError(errorMessage);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Scan failed: ${errorMessage}`, type: 'error' } });
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => {
        setScanError("Failed to read file.");
        setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description || !formData.userId) {
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Please fill all required fields.', type: 'error' } });
      return;
    }
    
    let transactionToSave: Omit<Transaction, 'id'> & { id?: string };
    
    if (formData.type === TransactionType.Transfer) {
        if (!formData.accountId || !formData.destinationAccountId || formData.accountId === formData.destinationAccountId) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'For transfers, "From" and "To" accounts must be different.', type: 'error' } });
            return;
        }
        transactionToSave = {
            ...formData,
            category: 'Transfer', // Set category internally
        };
    } else {
        if (!formData.category || !formData.accountId) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Please select an account and category.', type: 'error' } });
            return;
        }
        transactionToSave = {
            ...formData,
            destinationAccountId: undefined, // Ensure clean for non-transfers
        };
    }

    if (transaction) {
      const oldTransaction = state.transactions.find(t => t.id === transaction.id);
      if (!oldTransaction) {
        console.error("Old transaction not found for update");
        return;
      }
      const payload = {
        ...transactionToSave,
        id: transaction.id,
        date: new Date(formData.date).toISOString(),
      } as Transaction;
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { oldTransaction, newTransaction: payload } });
    } else {
       const payload: Transaction = {
        ...transactionToSave,
        id: generateId(),
        date: new Date(formData.date).toISOString(),
      };
      dispatch({ type: 'ADD_TRANSACTION', payload });
    }
    
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        message: `Transaction ${transaction ? 'updated' : 'added'} successfully!`,
        type: 'success',
      },
    });

    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);
  const inputStyles = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
  const labelStyles = "block text-sm font-medium text-gray-700 dark:text-slate-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelStyles}>User</label>
          <select name="userId" value={formData.userId} onChange={handleChange} className={inputStyles} required>
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelStyles}>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className={inputStyles}>
            {Object.values(TransactionType).map(type => (<option key={type} value={type}>{type}</option>))}
          </select>
        </div>
        
        {formData.type === TransactionType.Transfer ? (
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyles}>From Account</label>
                    <select name="accountId" value={formData.accountId} onChange={handleChange} className={inputStyles} required disabled={userAccounts.length < 2}>
                        {userAccounts.length < 2 ? <option>Need 2+ accounts</option> : userAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelStyles}>To Account</label>
                    <select name="destinationAccountId" value={formData.destinationAccountId} onChange={handleChange} className={inputStyles} required disabled={userAccounts.length < 2}>
                         {userAccounts.filter(a => a.id !== formData.accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
            </div>
        ) : (
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyles}>Account</label>
                    <select name="accountId" value={formData.accountId} onChange={handleChange} className={inputStyles} required disabled={userAccounts.length === 0}>
                        {userAccounts.length === 0 ? <option>No accounts for user</option> : userAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                </div>
                <div>
                    <div className="flex justify-between items-center">
                      <label htmlFor="category" className={labelStyles}>Category</label>
                       {isSuggesting && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                              <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Thinking...
                          </span>
                      )}
                    </div>
                    <select name="category" id="category" value={formData.category} onChange={handleChange} className={inputStyles} required>
                        <option value="" disabled>Select a category</option>
                        {filteredCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                     {categorySuggestion && !isSuggesting && (
                        <div className="mt-2 text-right">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, category: categorySuggestion }));
                                    setCategorySuggestion(null);
                                }}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500"
                            >
                                ✨ Suggest: <span className="font-semibold underline">{categorySuggestion}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        <div>
          <label className={labelStyles}>Amount</label>
          <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} className={inputStyles} placeholder="0" required />
        </div>
        
        <div>
          <label className={labelStyles}>Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} className={inputStyles} placeholder="e.g., Groceries" required/>
        </div>
        <div>
          <label className={labelStyles}>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputStyles} [color-scheme:dark]`} required/>
        </div>
        <div>
          <label className={labelStyles}>Tags</label>
          <div className={`mt-1 flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-slate-600 rounded-md ${inputStyles}`}>
            {formData.tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
                  &times;
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
              className="flex-grow border-none focus:ring-0 p-0 bg-transparent"
              placeholder="Add a tag..."
            />
          </div>
        </div>
         {formData.type === TransactionType.Expense && (
          <div>
            <label htmlFor="receipt-upload" className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-md inline-flex items-center justify-center">
              <CameraIcon className="w-5 h-5 mr-2" />
              <span>{isScanning ? 'Scanning...' : 'Scan Receipt with Gemini'}</span>
            </label>
            <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isScanning} />
            {scanError && <p className="text-red-500 text-sm mt-1">{scanError}</p>}
          </div>
        )}
        <div className="pt-4 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-slate-100 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" disabled={isScanning || isSuggesting || userAccounts.length === 0}>
            {isScanning || isSuggesting ? 'Working...' : (transaction ? 'Save Changes' : 'Add Transaction')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;