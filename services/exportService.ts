import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// FIX: Changed from an interface to a type intersection to correctly augment
// the jsPDF type with the autoTable method, ensuring base jsPDF methods are inherited.
// Define a local type to add the `autoTable` method to jsPDF instances.
// This avoids potential TypeScript errors if global module augmentation fails.
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDFWithAutoTable;
};

const generateCsvContent = (transactions: Transaction[]): string => {
  const header = ['Date', 'User', 'Type', 'Category', 'Amount', 'Description', 'Tags'];
  const rows = transactions.map(t => [
    t.date,
    t.userId,
    t.type,
    t.category,
    t.amount.toString(),
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.tags.join(', ')}"`,
  ]);
  return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const exportToCsv = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csvContent = generateCsvContent(transactions);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPdf = (transactions: Transaction[], filename: string = 'transactions.pdf') => {
  // Use a type assertion to inform TypeScript about the autoTable plugin method.
  const doc = new jsPDF() as jsPDFWithAutoTable;
  doc.text('Transaction History', 14, 16);

  const tableColumn = ['Date', 'User', 'Type', 'Category', 'Amount', 'Description'];
  const tableRows: (string | number)[][] = [];

  transactions.forEach(t => {
    const transactionData = [
      new Date(t.date).toLocaleDateString('id-ID'),
      t.userId,
      t.type,
      t.category,
      t.amount,
      t.description,
    ];
    tableRows.push(transactionData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save(filename);
};
