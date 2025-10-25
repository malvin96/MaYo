import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { useData } from '../context/DataContext';
import { Account } from '../types';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (accountData: Omit<Account, 'id' | 'balance'> & { balance?: number, id?: string }) => void;
    account: Account | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave, account }) => {
    const { state } = useData();
    const { users, currentUser } = state;
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'Bank',
        userId: currentUser === 'All' ? users[0]?.id : currentUser,
        balance: 0,
    });

    useEffect(() => {
        if (isOpen) {
            if (account) {
                setFormData({
                    name: account.name,
                    type: account.type,
                    userId: account.userId,
                    balance: account.balance,
                });
            } else {
                 setFormData({
                    name: '',
                    type: 'Bank',
                    userId: currentUser === 'All' ? users[0]?.id : currentUser,
                    balance: 0,
                });
            }
        }
    }, [isOpen, account, currentUser, users]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'balance' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.type || !formData.userId) {
            // Seharusnya tidak terjadi karena bidang-bidang ini wajib diisi, tetapi sebagai pengaman
            alert('Please fill all fields');
            return;
        }
        onSave(formData);
    };
    
    const inputStyles = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
    const labelStyles = "block text-sm font-medium text-gray-700 dark:text-slate-300";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Account' : 'Add New Account'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelStyles}>Account Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={inputStyles}
                        placeholder="e.g., BCA Savings"
                        required
                    />
                </div>
                 <div>
                    <label className={labelStyles}>User</label>
                    <select name="userId" value={formData.userId} onChange={handleChange} className={inputStyles} required>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelStyles}>Account Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={inputStyles}
                    >
                        <option value="Bank">Bank</option>
                        <option value="E-Wallet">E-Wallet</option>
                        <option value="Cash">Cash</option>
                        <option value="Investment">Investment</option>
                    </select>
                </div>
                {!account && (
                    <div>
                        <label className={labelStyles}>Initial Balance</label>
                        <input
                            type="number"
                            name="balance"
                            step="any"
                            value={formData.balance}
                            onChange={handleChange}
                            className={inputStyles}
                            placeholder="0"
                            required
                        />
                    </div>
                )}
                <div className="pt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-slate-100 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                </div>
            </form>
        </Modal>
    );
};

export default AccountModal;
