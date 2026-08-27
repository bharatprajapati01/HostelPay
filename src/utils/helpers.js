import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { getTransactions } from './storage';

// Generate unique IDs
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format currency
export function formatCurrency(amount, currency = '₹') {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Get transactions for a specific month
export function getMonthTransactions(year, month) {
  const transactions = getTransactions();
  return transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// Get summary for a specific month
export function getMonthSummary(year, month) {
  const transactions = getMonthTransactions(year, month);
  
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  
  // By category
  const byCategory = {};
  transactions.forEach((t) => {
    if (!byCategory[t.category]) {
      byCategory[t.category] = 0;
    }
    byCategory[t.category] += Number(t.amount);
  });

  // By payment type
  const byPaymentType = {
    online: 0,
    cash: 0,
  };
  transactions.forEach((t) => {
    byPaymentType[t.paymentType] += Number(t.amount);
  });

  // By account
  const byAccount = {};
  transactions.forEach((t) => {
    if (t.accountId) {
      if (!byAccount[t.accountId]) {
        byAccount[t.accountId] = 0;
      }
      byAccount[t.accountId] += Number(t.amount);
    }
  });

  return {
    totalSpent,
    transactionCount: transactions.length,
    byCategory,
    byPaymentType,
    byAccount,
    transactions,
  };
}

// Get list of months that have transactions
export function getActiveMonths() {
  const transactions = getTransactions();
  const monthSet = new Set();
  
  transactions.forEach((t) => {
    const d = new Date(t.date);
    monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  });

  return Array.from(monthSet)
    .map((key) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, label: format(new Date(year, month), 'MMMM yyyy') };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
}

// Get last N months for history chart
export function getLastNMonths(n = 6) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: format(d, 'MMM yyyy'),
      shortLabel: format(d, 'MMM'),
    });
  }
  return months;
}

// Get month label
export function getMonthLabel(year, month) {
  return format(new Date(year, month), 'MMMM yyyy');
}

// Get today's date string
export function getTodayString() {
  return format(new Date(), 'yyyy-MM-dd');
}

// Color palette for charts
export const CHART_COLORS = [
  '#00d4aa', '#7c3aed', '#f59e0b', '#3b82f6', '#ec4899',
  '#06b6d4', '#f97316', '#ef4444', '#a855f7', '#6b7280',
  '#10b981', '#e11d48', '#8b5cf6', '#14b8a6', '#d946ef',
];
