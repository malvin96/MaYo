import React from 'react';
import { View } from '../types';
import { DashboardIcon, TransactionsIcon, AccountsIcon, BudgetsIcon, InvestmentsIcon, ReportsIcon, SettingsIcon, AiIcon, HealthCheckIcon } from './icons/IconComponents';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NAV_ITEMS = [
    { view: 'Dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { view: 'Transactions', label: 'Transactions', icon: <TransactionsIcon /> },
    { view: 'Accounts', label: 'Accounts', icon: <AccountsIcon /> },
    { view: 'Budgets', label: 'Budgets', icon: <BudgetsIcon /> },
    { view: 'Investments', label: 'Investments', icon: <InvestmentsIcon /> },
    { view: 'Reports', label: 'Reports', icon: <ReportsIcon /> },
    { view: 'AI Assistant', label: 'AI Assistant', icon: <AiIcon /> },
    { view: 'Health Check', label: 'Health Check', icon: <HealthCheckIcon /> },
] as const;

const NavLink: React.FC<{
  view: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  onClick: () => void;
}> = ({ view, label, icon, activeView, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-2 text-base font-normal rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 group ${
        activeView === view ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </a>
  </li>
);


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <>
        <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Sidebar">
            <div className="h-full px-3 py-4 overflow-y-auto bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex items-center pl-2.5 mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white ml-2">MaYo Finance</span>
                </div>
                <ul className="space-y-2 font-medium flex-grow">
                    {NAV_ITEMS.map(item => (
                        <NavLink key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} />
                    ))}
                </ul>
                <div className="flex-shrink-0">
                   <ul className="space-y-2 font-medium">
                      <NavLink view="Settings" label="Settings" icon={<SettingsIcon />} activeView={activeView} onClick={() => handleNavClick('Settings')} />
                   </ul>
                </div>
            </div>
        </aside>
        {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Sidebar;