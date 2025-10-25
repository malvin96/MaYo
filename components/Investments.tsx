import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { formatCurrency, getUserNameById } from '../utils/helpers';
import { ArrowUpIcon, ArrowDownIcon, InvestmentsIcon } from './icons/IconComponents';

const Investments: React.FC = () => {
  const { state } = useData();
  const { investments, currentUser, users } = state;

  const filteredInvestments = useMemo(() => {
    return investments.filter(i => currentUser === 'All' || i.userId === currentUser);
  }, [investments, currentUser]);

  return (
    <>
      <FeatureHeader
        icon={<InvestmentsIcon />}
        title="Investments"
        subtitle="Monitor your portfolio and track asset performance."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvestments.map(investment => {
          const totalValue = investment.quantity * investment.currentPrice;
          const totalCost = investment.quantity * investment.purchasePrice;
          const gainLoss = totalValue - totalCost;
          const isGain = gainLoss >= 0;
          const gainLossPercentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

          return (
            <Card key={investment.id}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{investment.name}</h3>
                <span className="text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-full">{investment.type}</span>
              </div>
               {currentUser === 'All' && <p className="text-sm text-slate-500 dark:text-slate-400">{getUserNameById(users, investment.userId)}</p>}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{investment.quantity} units</p>
              <div className="mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalValue)}</p>
              </div>
              <div className={`flex items-center mt-2 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                {isGain ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                <span className="ml-1 font-semibold">{formatCurrency(gainLoss)} ({gainLossPercentage.toFixed(2)}%)</span>
              </div>
            </Card>
          );
        })}
        {filteredInvestments.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 col-span-full">No investments to display for the selected user.</p>
        )}
      </div>
    </>
  );
};

export default Investments;