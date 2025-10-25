import React from 'react';

interface FeatureHeaderProps {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const FeatureHeader: React.FC<FeatureHeaderProps> = ({ icon, title, subtitle, children }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
      <div className="flex items-center">
        <div className="hidden sm:block bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md dark:shadow-none dark:border dark:border-slate-700 mr-5">
          {React.cloneElement(icon, { className: "h-8 w-8 text-blue-600 dark:text-blue-500" })}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-4 sm:mt-0">
        {children}
      </div>
    </div>
  );
};

export default FeatureHeader;