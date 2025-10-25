import React, { useState } from 'react';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { useData } from '../context/DataContext';
import { SettingsIcon, EditIcon, DeleteIcon, PlusIcon, SunIcon, MoonIcon } from './icons/IconComponents';
import { Category, TransactionType } from '../types';
import { generateId } from '../utils/helpers';
import CategoryModal from './CategoryModal';

const Settings: React.FC = () => {
  const { state, dispatch } = useData();
  const { theme, categories } = state;
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleThemeToggle = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };
  
  const openCategoryModal = (category: Category | null) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };
  
  const closeCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleCategorySave = (category: Category) => {
    if (editingCategory) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: category });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Category updated', type: 'success' } });
    } else {
      dispatch({ type: 'ADD_CATEGORY', payload: { ...category, id: generateId() } });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Category added', type: 'success' } });
    }
    closeCategoryModal();
  };

  const handleCategoryDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
        dispatch({ type: 'DELETE_CATEGORY', payload: id });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Category deleted', type: 'success' } });
    }
  };


  return (
    <>
      <FeatureHeader
        icon={<SettingsIcon />}
        title="Settings"
        subtitle="Customize users, categories, and application appearance."
       />
      <div className="space-y-6">
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Appearance</h3>
            <div className="flex items-center justify-between">
                <label id="theme-label" className="text-slate-600 dark:text-slate-300">Theme</label>
                <div className="flex items-center p-1 rounded-full bg-slate-200 dark:bg-slate-700">
                    <button 
                        onClick={() => theme === 'dark' && handleThemeToggle()}
                        className={`p-2 rounded-full transition-colors duration-300 ${theme === 'light' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-500'}`}
                        aria-pressed={theme === 'light'}
                        aria-label="Switch to light theme"
                    >
                        <SunIcon className={`w-5 h-5 ${theme === 'light' ? 'text-yellow-500' : ''}`} />
                    </button>
                    <button 
                        onClick={() => theme === 'light' && handleThemeToggle()}
                        className={`p-2 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500'}`}
                        aria-pressed={theme === 'dark'}
                        aria-label="Switch to dark theme"
                    >
                        <MoonIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : ''}`} />
                    </button>
                </div>
            </div>
        </Card>

        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Category Management</h3>
                <button onClick={() => openCategoryModal(null)} className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div>
                            <span className="font-medium">{cat.name}</span>
                            <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${cat.type === TransactionType.Income ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                                {cat.type}
                            </span>
                        </div>
                        <div>
                            <button onClick={() => openCategoryModal(cat)} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 p-1"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleCategoryDelete(cat.id)} className="text-slate-500 dark:text-slate-400 hover:text-red-600 p-1 ml-2"><DeleteIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
      </div>

      {isCategoryModalOpen && (
        <CategoryModal 
            isOpen={isCategoryModalOpen}
            onClose={closeCategoryModal}
            onSave={handleCategorySave}
            category={editingCategory}
        />
      )}
    </>
  );
};

export default Settings;
