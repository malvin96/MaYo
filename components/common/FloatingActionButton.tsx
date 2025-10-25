import React from 'react';
import { PlusIcon } from '../icons/IconComponents';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
      aria-label="Add new transaction"
    >
      <PlusIcon className="w-6 h-6" />
    </button>
  );
};

export default FloatingActionButton;