
import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ToastMessage } from '../types';

const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, onDismiss]);

  const baseClasses = 'p-4 rounded-md shadow-lg text-white font-semibold transition-all duration-300';
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[message.type]}`}>
      {message.message}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useData();
  const { toasts } = state;

  const handleDismiss = (id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  return (
    <div className="fixed top-5 right-5 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
