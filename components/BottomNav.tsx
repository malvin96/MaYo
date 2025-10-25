import React from 'react';
import { View } from '../types';
import { DashboardIcon, TransactionsIcon, AccountsIcon, AiIcon } from './icons/IconComponents';

interface BottomNavProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

const NAV_ITEMS = [
    { view: 'Dashboard', label: 'Home', icon: <DashboardIcon className="w-5 h-5 mb-1"/> },
    { view: 'Transactions', label: 'History', icon: <TransactionsIcon className="w-5 h-5 mb-1"/> },
    { view: 'Accounts', label: 'Accounts', icon: <AccountsIcon className="w-5 h-5 mb-1"/> },
    { view: 'AI Assistant', label: 'AI', icon: <AiIcon className="w-5 h-5 mb-1"/> },
] as const;

const NavItem: React.FC<{
    view: View;
    label: string;
    icon: React.ReactNode;
    activeView: View;
    onClick: () => void;
}> = ({ view, label, icon, activeView, onClick }) => (
    <button
        onClick={onClick}
        className={`inline-flex flex-col items-center justify-center px-5 group w-full h-full focus:outline-none ${
            activeView === view ? 'text-blue-600 dark:text-blue-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
    >
        {icon}
        <span className={`text-xs ${activeView === view ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
    const handleNavClick = (view: View) => {
        setActiveView(view);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
                {NAV_ITEMS.map(item => (
                    <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} />
                ))}
            </div>
        </div>
    );
};

export default BottomNav;