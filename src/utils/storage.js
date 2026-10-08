import { api, getToken } from './api';

// Storage keys
const KEYS = {
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
  if (key === KEYS.CURRENT_USER) {
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
  if (SYNCED_KEYS.includes(key)) scheduleSync();
}

// ─── Server sync ─────────────────────────────────────────
// localStorage stays the fast local copy. Every change is also pushed to the
// server (debounced), so the same account shows the same data on any device.
const SYNCED_KEYS = [
  KEYS.ACCOUNTS,
  KEYS.TRANSACTIONS,
  KEYS.CATEGORIES,
  KEYS.CASH_WALLET,
  KEYS.SAVINGS_GOALS,
  KEYS.SAVINGS_TRANSFERS,
];
let syncTimer = null;
let syncPending = false;
// Nothing is uploaded until the first download from the server has finished.
// Otherwise a fresh device could upload its empty defaults over the real data.
let syncEnabled = false;

export function setSyncEnabled(enabled) {
  syncEnabled = enabled;
  if (!enabled) {
    clearTimeout(syncTimer);
    syncPending = false;
  }
}

export function hasPendingSync() {
  return syncPending;
}

function scheduleSync() {
  if (!syncEnabled || !getToken() || !getCurrentUser()) return;
  syncPending = true;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => flushSync(), 700);
}

export function getLocalSnapshot() {
  const data = {};
  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(getScopedKey(key));
    if (raw) data[key] = JSON.parse(raw);
  }
  return data;
}

export async function flushSync({ keepalive = false } = {}) {
  clearTimeout(syncTimer);
  if (!syncPending || !getToken()) return;
  syncPending = false;
  try {
    await api('/api/data', { method: 'PUT', body: { data: getLocalSnapshot() }, keepalive });
  } catch (err) {
    if (err.status !== 401) syncPending = true; // network problem: retry on the next change
  }
}

// Replace the local copy with what the server has. Returns false if the server has nothing yet.
export function hydrateFromServer(data) {
  if (!data || Object.keys(data).length === 0) return false;
  for (const key of SYNCED_KEYS) {
    if (data[key] !== undefined) localStorage.setItem(getScopedKey(key), JSON.stringify(data[key]));
  }
  return true;
}

export function pushLocalToServer() {
  syncPending = true;
  return flushSync();
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

// ─── Session ─────────────────────────────────────────────
// Accounts and passwords live on the server. Only the signed-in username is kept here.
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


