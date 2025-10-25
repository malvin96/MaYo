import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Accounts from './components/Accounts';
import Budget from './components/Budget';
import Investments from './components/Investments';
import Reports from './components/Reports';
import Settings from './components/Settings';
import AI from './components/AI';
import HealthCheck from './components/HealthCheck';
import BottomNav from './components/BottomNav';
import { DataProvider, useData } from './context/DataContext';
import { View, Transaction } from './types';
import { ToastContainer } from './components/Toast';
import FloatingActionButton from './components/common/FloatingActionButton';
import TransactionModal from './components/TransactionModal';

interface MainContentProps {
    activeView: View;
    onEditTransaction: (transaction: Transaction) => void;
    onAddTransaction: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ activeView, onEditTransaction, onAddTransaction }) => {
  switch (activeView) {
    case 'Dashboard':
      return <Dashboard onAddTransaction={onAddTransaction} />;
    case 'Transactions':
      return <Transactions onEditTransaction={onEditTransaction} />;
    case 'Accounts':
      return <Accounts />;
    case 'Budgets':
      return <Budget />;
    case 'Investments':
        return <Investments />;
    case 'Reports':
        return <Reports />;
    case 'Health Check':
        return <HealthCheck />;
    case 'AI Assistant':
        return <AI />;
    case 'Settings':
      return <Settings />;
    default:
      return <Dashboard onAddTransaction={onAddTransaction} />;
  }
};

const AppContent: React.FC = () => {
    const { state } = useData();
    const [activeView, setActiveView] = useState<View>('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        if (state.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }, [state.theme]);
    
    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };
    
    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    return (
        <div className={`flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200`}>
            <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header activeView={activeView} onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
                    <MainContent 
                        activeView={activeView} 
                        onEditTransaction={handleEditTransaction}
                        onAddTransaction={handleAddTransaction}
                    />
                </main>
                 <BottomNav activeView={activeView} setActiveView={setActiveView} />
            </div>

            <FloatingActionButton onClick={handleAddTransaction} />
            
            {isModalOpen && (
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    transaction={editingTransaction}
                />
            )}
            
            <ToastContainer />
        </div>
    );
};

const App: React.FC = () => {
  return (
    <DataProvider>
        <AppContent />
    </DataProvider>
  );
};

export default App;