import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { formatCurrency, getUserNameById, generateId } from '../utils/helpers';
import { AccountsIcon, PlusIcon, EditIcon, DeleteIcon } from './icons/IconComponents';
import AccountModal from './AccountModal';
import { Account } from '../types';

const Accounts: React.FC = () => {
  const { state, dispatch } = useData();
  const { accounts, currentUser, users, transactions } = state;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => currentUser === 'All' || a.userId === currentUser);
  }, [accounts, currentUser]);

  const totalBalance = useMemo(() => {
    return filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [filteredAccounts]);
  
  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };
  
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };
  
  const handleSaveAccount = (accountData: Omit<Account, 'id' | 'balance'> & { balance?: number, id?: string }) => {
    if (editingAccount) {
        // Editing: merge existing data with new data
        const updatedAccount: Account = {
            ...editingAccount,
            name: accountData.name,
            type: accountData.type,
            userId: accountData.userId,
        };
        dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Account updated successfully!', type: 'success' } });
    } else {
        // Adding: create new account with generated ID and initial balance
        const newAccount: Account = {
            id: generateId(),
            name: accountData.name,
            type: accountData.type,
            userId: accountData.userId,
            balance: accountData.balance || 0,
        };
        dispatch({ type: 'ADD_ACCOUNT', payload: newAccount });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Account added successfully!', type: 'success' } });
    }
    handleCloseModal();
  };

  const handleDeleteAccount = (accountId: string) => {
    const isAccountUsed = transactions.some(t => t.accountId === accountId || t.destinationAccountId === accountId);
    if (isAccountUsed) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Cannot delete account with existing transactions.', type: 'error' } });
        return;
    }

    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        dispatch({ type: 'DELETE_ACCOUNT', payload: accountId });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Account deleted.', type: 'success' } });
    }
  };


  return (
    <>
      <FeatureHeader
        icon={<AccountsIcon />}
        title="Accounts"
        subtitle="Manage your bank accounts, e-wallets, and cash."
      >
        <button
            onClick={handleAddAccount}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
        >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Account
        </button>
      </FeatureHeader>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-blue-500 to-sky-600 text-white">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-lg font-medium opacity-90">Total Balance</p>
                    <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
                 <div className="p-4 bg-white/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map(account => (
            <Card key={account.id} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{account.name}</h3>
                  <span className="text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">{account.type}</span>
                </div>
                {currentUser === 'All' && <p className="text-sm text-slate-500 dark:text-slate-400">{getUserNameById(users, account.userId)}</p>}
                 <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-4">
                    {formatCurrency(account.balance)}
                </p>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-3 flex justify-end space-x-2">
                 <button onClick={() => handleEditAccount(account)} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 p-1" aria-label="Edit Account">
                    <EditIcon className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleDeleteAccount(account.id)} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 p-1" aria-label="Delete Account">
                    <DeleteIcon className="w-5 h-5" />
                 </button>
              </div>
            </Card>
          ))}
          {filteredAccounts.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 col-span-full text-center py-8">No accounts to display for the selected user.</p>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <AccountModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveAccount}
            account={editingAccount}
        />
      )}
    </>
  );
};

export default Accounts;