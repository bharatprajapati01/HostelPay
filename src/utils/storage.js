// Storage keys
const KEYS = {
  USERS: 'hostelPay_users',
  CURRENT_USER: 'hostelPay_currentUser',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  CASH_WALLET: 'cashWallet',
  SETTINGS: 'settings',
  SAVINGS_GOALS: 'savingsGoals',
  SAVINGS_TRANSFERS: 'savingsTransfers',
};

function getCurrentUser() {
  return localStorage.getItem(KEYS.CURRENT_USER) || null;
}

function getScopedKey(key) {
  if (key === KEYS.USERS || key === KEYS.CURRENT_USER) {
    return key;
  }
  const user = getCurrentUser();
  if (!user) return `hostelPay_guest_${key}`;
  return `hostelPay_${user}_${key}`;
}

// Generic helpers
function getItem(key, fallback = null) {
  try {
    const scopedKey = getScopedKey(key);
    let data = localStorage.getItem(scopedKey);
    
    // Legacy migration: if scoped key doesn't exist but legacy non-scoped key does, migrate it
    if (!data) {
      const user = getCurrentUser();
      // Only migrate legacy data if we have a valid logged in user (e.g. 'student')
      if (user) {
        const legacyKey = `hostelPay_${key}`;
        const legacyData = localStorage.getItem(legacyKey);
        if (legacyData) {
          localStorage.setItem(scopedKey, legacyData);
          data = legacyData;
        }
      }
    }
    
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key, value) {
  const scopedKey = getScopedKey(key);
  localStorage.setItem(scopedKey, JSON.stringify(value));
}

// ─── Accounts ────────────────────────────────────────────
export function getAccounts() {
  return getItem(KEYS.ACCOUNTS, []);
}

export function saveAccounts(accounts) {
  setItem(KEYS.ACCOUNTS, accounts);
}

export function addAccount(account) {
  const accounts = getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
  return accounts;
}

export function updateAccount(id, updates) {
  const accounts = getAccounts().map((a) =>
    a.id === id ? { ...a, ...updates } : a
  );
  saveAccounts(accounts);
  return accounts;
}

export function deleteAccount(id) {
  const accounts = getAccounts().filter((a) => a.id !== id);
  saveAccounts(accounts);
  return accounts;
}

// ─── Transactions ────────────────────────────────────────
export function getTransactions() {
  return getItem(KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions) {
  setItem(KEYS.TRANSACTIONS, transactions);
}

export function addTransaction(transaction) {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
  return transactions;
}

export function updateTransaction(id, updates) {
  const transactions = getTransactions().map((t) =>
    t.id === id ? { ...t, ...updates } : t
  );
  saveTransactions(transactions);
  return transactions;
}

export function deleteTransaction(id) {
  const transactions = getTransactions().filter((t) => t.id !== id);
  saveTransactions(transactions);
  return transactions;
}

// ─── Categories ──────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Mess Fee', color: '#00d4aa', icon: 'UtensilsCrossed' },
  { id: 'cat-2', name: 'Food (Outside)', color: '#f59e0b', icon: 'Pizza' },
  { id: 'cat-3', name: 'Transport', color: '#3b82f6', icon: 'Bus' },
  { id: 'cat-4', name: 'Laundry', color: '#8b5cf6', icon: 'Shirt' },
  { id: 'cat-5', name: 'Stationery', color: '#ec4899', icon: 'PenTool' },
  { id: 'cat-6', name: 'Recharge', color: '#06b6d4', icon: 'Smartphone' },
  { id: 'cat-7', name: 'Entertainment', color: '#f97316', icon: 'Gamepad2' },
  { id: 'cat-8', name: 'Medical', color: '#ef4444', icon: 'HeartPulse' },
  { id: 'cat-9', name: 'Shopping', color: '#a855f7', icon: 'ShoppingBag' },
  { id: 'cat-10', name: 'Miscellaneous', color: '#6b7280', icon: 'MoreHorizontal' },
];

export function getCategories() {
  const cats = getItem(KEYS.CATEGORIES, null);
  if (cats === null) {
    saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return cats;
}

export function saveCategories(categories) {
  setItem(KEYS.CATEGORIES, categories);
}

export function addCategory(category) {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
  return categories;
}

export function updateCategory(id, updates) {
  const categories = getCategories().map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );
  saveCategories(categories);
  return categories;
}

export function deleteCategory(id) {
  const categories = getCategories().filter((c) => c.id !== id);
  saveCategories(categories);
  return categories;
}

// ─── Cash Wallet ─────────────────────────────────────────
export function getCashWallet() {
  return getItem(KEYS.CASH_WALLET, { balance: 0, lastUpdated: new Date().toISOString() });
}

export function saveCashWallet(wallet) {
  setItem(KEYS.CASH_WALLET, { ...wallet, lastUpdated: new Date().toISOString() });
}

export function updateCashBalance(amount) {
  const wallet = getCashWallet();
  wallet.balance += amount;
  saveCashWallet(wallet);
  return wallet;
}

// ─── Settings ────────────────────────────────────────────
export function getSettings() {
  return getItem(KEYS.SETTINGS, { currency: '₹', monthlyBudget: 0 });
}

export function saveSettings(settings) {
  setItem(KEYS.SETTINGS, settings);
}

// ─── Savings Goals ───────────────────────────────────────
export function getSavingsGoals() {
  return getItem(KEYS.SAVINGS_GOALS, []);
}

export function saveSavingsGoals(goals) {
  setItem(KEYS.SAVINGS_GOALS, goals);
}

// ─── Savings Transfers ───────────────────────────────────
export function getSavingsTransfers() {
  return getItem(KEYS.SAVINGS_TRANSFERS, []);
}

export function saveSavingsTransfers(transfers) {
  setItem(KEYS.SAVINGS_TRANSFERS, transfers);
}

// ─── Users & Auth ────────────────────────────────────────
export function getUsers() {
  const users = getItem(KEYS.USERS, null);
  if (!users) {
    const defaultUsers = [{ username: 'student', password: '123' }];
    setItem(KEYS.USERS, defaultUsers);
    return defaultUsers;
  }
  return users;
}

export function saveUsers(users) {
  setItem(KEYS.USERS, users);
}

export function getCurrentUserStorage() {
  return localStorage.getItem(KEYS.CURRENT_USER);
}

export function setCurrentUserStorage(username) {
  if (username) {
    localStorage.setItem(KEYS.CURRENT_USER, username);
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}


