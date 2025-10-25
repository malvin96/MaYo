import { Transaction, User } from "./types";

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  export const generateId = (): string => {
    return `id_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  export const getUserNameById = (users: User[], userId: string): string => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  }

  // A simple fuzzy search for transactions for the AI edit feature
export const findTransactionByQuery = (transactions: Transaction[], query: string, userId: string): Transaction | null => {
    const now = new Date();
    const queryLower = query.toLowerCase();

    const userTransactions = transactions.filter(t => t.userId === userId);

    // Sort by most recent first
    userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const t of userTransactions) {
        const descriptionLower = t.description.toLowerCase();
        const categoryLower = t.category.toLowerCase();
        const transactionDate = new Date(t.date);

        const keywords = queryLower.split(' ').filter(kw => kw.length > 2);
        const matches = keywords.every(kw => descriptionLower.includes(kw) || categoryLower.includes(kw));

        // Prioritize recent transactions
        const daysDifference = (now.getTime() - transactionDate.getTime()) / (1000 * 3600 * 24);

        if (matches && daysDifference < 30) { // Look within the last 30 days
            return t;
        }
    }
    
    return null; // No close match found
};