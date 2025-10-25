import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import FeatureHeader from './common/FeatureHeader';
import { HealthCheckIcon } from './icons/IconComponents';
import { useData } from '../context/DataContext';
import { getFinancialHealthReport } from '../services/geminiService';
import { TransactionType } from '../types';
import ReactMarkdown from 'react-markdown';

// A simple circular progress bar for the score
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s > 75) return 'text-green-500';
        if (s > 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32">
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
                <circle
                    className={`${getColor(score)} transition-all duration-1000 ease-in-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                    transform="rotate(-90 64 64)"
                />
            </svg>
            <span className={`absolute text-3xl font-bold ${getColor(score)}`}>
                {score}
            </span>
        </div>
    );
};

// Component to render specific sections of the report with icons
const ReportSection: React.FC<{ title: string; content: string }> = ({ title, content }) => {
    const getIcon = () => {
        switch (title) {
            case "What You're Doing Well":
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
            case 'Areas for Improvement':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.214 2.27-1.214 2.906 0l4.257 8.121c.544 1.039-.14 2.28-1.288 2.28H5.288c-1.147 0-1.832-1.241-1.288-2.28l4.257-8.121zM10 12a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
            case 'Actionable Tips':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h.01a1 1 0 100-2H11zM10 3a1 1 0 00-1 1v1a1 1 0 102 0V4a1 1 0 00-1-1zM10 16a1 1 0 01-.707-.293l-1-1a1 1 0 111.414-1.414l.293.293V12a1 1 0 112 0v1.586l.293-.293a1 1 0 111.414 1.414l-1 1A1 1 0 0110 16zM6 8a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.522-3.698 6.012 6.012 0 013.698-1.522c.592.056 1.18.22 1.714.474a1 1 0 10.708-1.848 8.012 8.012 0 00-2.422-.647 8.012 8.012 0 00-4.938 2.064A8.012 8.012 0 002.13 10c.057.818.293 1.603.682 2.31a1 1 0 101.832-.78A6.012 6.012 0 014.332 8.027z" clipRule="evenodd" /></svg>;
            default:
                return null;
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">{getIcon()}{title}</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
};


const HealthCheck: React.FC = () => {
    const { state } = useData();
    const { transactions, accounts, investments, budgets, currentUser } = state;

    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const financialData = useMemo(() => {
        const timeframeMonths = 3;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - timeframeMonths, 1);

        const relevantTransactions = transactions.filter(t => 
            (currentUser === 'All' || t.userId === currentUser) &&
            new Date(t.date) >= startDate
        );

        const totalIncome = relevantTransactions.filter(t => t.type === TransactionType.Income).reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = relevantTransactions.filter(t => t.type === TransactionType.Expense).reduce((sum, t) => sum + t.amount, 0);

        const expenseBreakdown: { [key: string]: number } = {};
        relevantTransactions.filter(t => t.type === TransactionType.Expense).forEach(t => {
            expenseBreakdown[t.category] = (expenseBreakdown[t.category] || 0) + t.amount;
        });

        const relevantBudgets = budgets.filter(b => currentUser === 'All' || b.userId === currentUser);
        const budgetAdherence = relevantBudgets.map(b => {
            const spent = expenseBreakdown[b.category] || 0;
            return {
                category: b.category,
                budgeted: b.amount * timeframeMonths, // Assuming monthly budget
                spent: spent,
                status: spent > b.amount * timeframeMonths ? 'overspent' : 'ok'
            };
        });

        const userAccounts = accounts.filter(a => currentUser === 'All' || a.userId === currentUser);
        const cashAndBank = userAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        const userInvestments = investments.filter(i => currentUser === 'All' || i.userId === currentUser);
        const investmentValue = userInvestments.reduce((sum, inv) => sum + (inv.currentPrice * inv.quantity), 0);

        return {
            timeframe_months: timeframeMonths,
            currency: "IDR",
            total_income: totalIncome,
            total_expense: totalExpense,
            savings_rate_percent: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0,
            expense_breakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({ category, amount })),
            net_worth: {
                cash_and_bank: cashAndBank,
                investments: investmentValue,
            },
            budget_adherence: budgetAdherence,
        };
    }, [transactions, accounts, investments, budgets, currentUser]);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await getFinancialHealthReport(financialData);
            setReport(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const parsedReport = useMemo(() => {
        if (!report) return null;
        const sections: { [key: string]: string } = {};
        const scoreRegex = /### Score\s*\n(\d+)/;
        const scoreMatch = report.match(scoreRegex);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
        
        const content = report.replace(scoreRegex, '').trim();
        const parts = content.split(/###\s(.*?)\n/);

        for (let i = 1; i < parts.length; i += 2) {
            sections[parts[i].trim()] = parts[i + 1].trim();
        }
        
        return { score, ...sections };
    }, [report]);

    return (
        <>
            <FeatureHeader
                icon={<HealthCheckIcon />}
                title="Financial Health Check"
                subtitle="Get AI-powered insights into your financial well-being."
            />
            <Card>
                {!report && !isLoading && !error && (
                     <div className="text-center py-12">
                        <HealthCheckIcon className="mx-auto h-12 w-12 text-blue-500" />
                        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Ready for your check-up?</h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Our AI will analyze your recent financial data to provide a health score, insights, and actionable tips.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                            >
                                Analyze My Financial Health
                            </button>
                        </div>
                    </div>
                )}
                
                {isLoading && (
                    <div className="text-center py-12">
                        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-slate-600 dark:text-slate-300 font-medium">Analyzing your data... please wait.</p>
                    </div>
                )}
                
                {error && (
                    <div className="text-center py-12">
                        <p className="text-red-500">{error}</p>
                        <button onClick={handleAnalyze} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">Try Again</button>
                    </div>
                )}

                {parsedReport && (
                    <div className="p-4 space-y-8">
                        <div className="text-center">
                            <h2 className="text-lg font-medium text-slate-600 dark:text-slate-300">Your Financial Health Score</h2>
                            <ScoreGauge score={parsedReport.score} />
                        </div>
                        
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{parsedReport['Summary'] || ''}</ReactMarkdown>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ReportSection title="What You're Doing Well" content={parsedReport["What You're Doing Well"] || 'No data.'} />
                            <ReportSection title="Areas for Improvement" content={parsedReport['Areas for Improvement'] || 'No data.'} />
                            <ReportSection title="Actionable Tips" content={parsedReport['Actionable Tips'] || 'No data.'} />
                        </div>

                        <div className="text-center pt-4">
                             <button onClick={handleAnalyze} className="px-4 py-2 bg-blue-600 text-white rounded-md">Re-analyze</button>
                        </div>

                    </div>
                )}
            </Card>
        </>
    );
};

export default HealthCheck;
