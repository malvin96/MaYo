import React from 'react';
import Card from './common/Card';
import { PlusIcon } from './icons/IconComponents';

interface DashboardEmptyStateProps {
    userName: string;
    onAddTransaction: () => void;
}

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({ userName, onAddTransaction }) => {
    return (
        <Card>
            <div className="text-center py-12">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                 </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome, {userName}!</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                    It looks like you haven't added any transactions yet.
                    <br />
                    Let's get started by adding your first one.
                </p>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onAddTransaction}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Add First Transaction
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default DashboardEmptyState;