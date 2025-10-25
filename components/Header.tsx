import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { View } from '../types';
import { EditIcon, CheckIcon } from './icons/IconComponents';

interface HeaderProps {
  activeView: View;
  onMenuClick: () => void;
}

const UserButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isActive 
                ? 'bg-blue-600 text-white shadow' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
        >
            {children}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ activeView, onMenuClick }) => {
  const { state, dispatch } = useData();
  const { users, currentUser } = state;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = users.find(u => u.id === currentUser);

  useEffect(() => {
    setIsEditingName(false);
  }, [currentUser]);

  const handleUserChange = (userId: string) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: userId });
  };

  const handleEditClick = () => {
    if (selectedUser) {
      setEditedName(selectedUser.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (isEditingName && selectedUser && editedName.trim() && editedName.trim() !== selectedUser.name) {
      const updatedUsers = users.map(u =>
        u.id === currentUser ? { ...u, name: editedName.trim() } : u
      );
      dispatch({ type: 'UPDATE_USERS', payload: updatedUsers });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'User name updated!', type: 'success' } });
    }
    setIsEditingName(false);
  };

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };
  
  const handleSaveClick = () => {
    inputRef.current?.blur();
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm p-4 flex justify-between items-center z-10 md:justify-end">
      <div className="flex items-center md:hidden">
         <button onClick={onMenuClick} className="mr-4 text-slate-600 dark:text-slate-300">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
         </button>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center p-1 space-x-1 rounded-full bg-slate-100 dark:bg-slate-800">
            {users.map(user => (
                 <UserButton key={user.id} isActive={currentUser === user.id} onClick={() => handleUserChange(user.id)}>
                    {user.name}
                 </UserButton>
            ))}
            <UserButton isActive={currentUser === 'All'} onClick={() => handleUserChange('All')}>
                All Users
            </UserButton>
        </div>
        <div className="flex items-center">
             {currentUser !== 'All' && isEditingName ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleNameInputKeyDown}
                    onBlur={handleSaveName}
                    autoFocus
                    className="block w-32 pl-3 pr-2 py-1 text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-md"
                />
            ) : null}

            {currentUser !== 'All' && (
                 <button
                    onClick={isEditingName ? handleSaveClick : handleEditClick}
                    className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-500 p-1 ml-1"
                    aria-label={isEditingName ? 'Save name' : 'Edit name'}
                >
                    {isEditingName ? <CheckIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                </button>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;