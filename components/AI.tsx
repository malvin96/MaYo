import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { chatWithAI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { AiIcon, PlusIcon, EditIcon } from './icons/IconComponents';
import { useData } from '../context/DataContext';
import { ChatMessage, Transaction, TransactionType } from '../types';
import { findTransactionByQuery, generateId } from '../utils/helpers';

const AI: React.FC = () => {
  const { state, dispatch } = useData();
  const { categories, currentUser, users, transactions, accounts, aiChatHistory } = state;
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [aiChatHistory]);
  
  // Menampilkan pesan selamat datang jika riwayat obrolan kosong
  useEffect(() => {
      if (aiChatHistory.length === 0) {
          const welcomeMessage: ChatMessage = {
              sender: 'ai',
              text: "Hello! I'm MaYo Assist, your personal AI for managing finances. How can I help you today? You can ask me to add or update transactions, for example: 'Add expense 50000 for coffee' or 'update my grocery bill to 300000'."
          };
          dispatch({ type: 'ADD_AI_CHAT_MESSAGE', payload: welcomeMessage });
      }
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    dispatch({ type: 'ADD_AI_CHAT_MESSAGE', payload: userMessage });
    setInput('');
    setIsLoading(true);

    try {
        const response = await chatWithAI(input, categories);
        const aiMessage: ChatMessage = { sender: 'ai', text: response.text };
        
        if (response.functionCall) {
            const { name, args } = response.functionCall;
            const activeUserId = currentUser !== 'All' ? currentUser : users[0].id;
            const userAccounts = accounts.filter(acc => acc.userId === activeUserId);

            if (name === 'add_transaction') {
                if(userAccounts.length > 0) {
                    aiMessage.text = `I can help with that. Here is the transaction I've prepared (it will be assigned to your primary account: ${userAccounts[0].name}). Please review and confirm.`;
                    aiMessage.action = {
                        type: 'add_transaction',
                        payload: args,
                    };
                } else {
                    aiMessage.text = `I can't add a transaction because no accounts are set up for ${users.find(u => u.id === activeUserId)?.name}.`;
                }
            } else if (name === 'update_transaction') {
                 const transactionToUpdate = findTransactionByQuery(transactions, args.search_query, activeUserId);
                 if (transactionToUpdate) {
                    aiMessage.text = `I found a transaction matching "${args.search_query}". Please review the changes and confirm.`;
                    aiMessage.action = {
                        type: 'update_transaction',
                        payload: { ...transactionToUpdate, ...args.updates },
                    };
                 } else {
                    aiMessage.text = `Sorry, I couldn't find a recent transaction matching "${args.search_query}". Could you be more specific?`;
                 }
            }
        }
        
        dispatch({ type: 'ADD_AI_CHAT_MESSAGE', payload: aiMessage });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      dispatch({ type: 'ADD_AI_CHAT_MESSAGE', payload: { sender: 'ai', text: `Sorry, I encountered an error: ${errorMessage}` } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = (action: ChatMessage['action']) => {
    if (!action) return;
    
    // Clear the action from the message so it can't be confirmed again
    const updatedHistory = aiChatHistory.map(msg => msg.action === action ? { ...msg, action: undefined } : msg);
    dispatch({ type: 'SET_AI_CHAT_HISTORY', payload: updatedHistory });

    const userId = currentUser !== 'All' ? currentUser : users[0].id;
    const userAccounts = accounts.filter(acc => acc.userId === userId);
    if (userAccounts.length === 0) {
        dispatch({ type: 'ADD_TOAST', payload: { message: `No accounts found for ${users.find(u=>u.id === userId)?.name}. Cannot add transaction.`, type: 'error' } });
        return;
    }
    const defaultAccountId = userAccounts[0].id;

    if (action.type === 'add_transaction') {
        const { amount, description, category, type } = action.payload;
        const newTransaction: Transaction = {
            id: generateId(),
            userId,
            accountId: defaultAccountId,
            amount: Number(amount),
            description,
            category,
            type: type as TransactionType,
            date: new Date().toISOString(),
            tags: ['ai-generated'],
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction added by AI!', type: 'success' } });
    } else if (action.type === 'update_transaction') {
        const oldTransaction = transactions.find(t => t.id === action.payload.id);
        if (oldTransaction) {
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { oldTransaction, newTransaction: action.payload } });
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction updated by AI!', type: 'success' } });
        }
    }
  };

  const handleCancelAction = (action: ChatMessage['action']) => {
     if (!action) return;
     const updatedHistory = aiChatHistory.map(msg => msg.action === action ? { ...msg, action: undefined, text: "Okay, I've cancelled that action." } : msg);
     dispatch({ type: 'SET_AI_CHAT_HISTORY', payload: updatedHistory });
  };


  return (
    <>
      <FeatureHeader
        icon={<AiIcon />}
        title="MaYo Assist"
        subtitle="Your AI assistant for managing transactions via chat."
      />
      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {aiChatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.text}</ReactMarkdown>
                {msg.action && (
                  <div className="mt-2 border-t border-slate-300 dark:border-slate-600 pt-2">
                    <h4 className="font-bold text-sm mb-2 flex items-center">
                        {msg.action.type === 'add_transaction' ? <PlusIcon className="w-4 h-4 mr-1"/> : <EditIcon className="w-4 h-4 mr-1"/>}
                        Confirm Action
                    </h4>
                    <div className="text-xs space-y-1 bg-black/10 dark:bg-black/20 p-2 rounded">
                        <p><strong>Desc:</strong> {msg.action.payload.description}</p>
                        <p><strong>Amount:</strong> {msg.action.payload.amount}</p>
                        <p><strong>Category:</strong> {msg.action.payload.category}</p>
                    </div>
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={() => handleCancelAction(msg.action)} className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                        <button onClick={() => handleConfirmAction(msg.action)} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Confirm</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-md p-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center">
                        <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        </div>
                    </div>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Yesterday I bought coffee for 25000"
              className="flex-grow p-2 border rounded-md bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </Card>
    </>
  );
};

export default AI;