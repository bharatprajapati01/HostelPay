import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getAccounts,
  saveAccounts,
  getTransactions,
  saveTransactions,
  getCategories,
  saveCategories,
  getCashWallet,
  saveCashWallet,
  getSavingsGoals,
  saveSavingsGoals,
  getSavingsTransfers,
  saveSavingsTransfers,
  getCurrentUserStorage,
  setCurrentUserStorage,
  hydrateFromServer,
  pushLocalToServer,
  flushSync,
  hasPendingSync,
  setSyncEnabled,
} from '../utils/storage';
import { api, getToken, setToken } from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserStorage());
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [transactions, setTransactions] = useState(() => getTransactions());
  const [categories, setCategories] = useState(() => getCategories());
  const [cashWallet, setCashWallet] = useState(() => getCashWallet());
  const [savingsGoals, setSavingsGoals] = useState(() => getSavingsGoals());
  const [savingsTransfers, setSavingsTransfers] = useState(() => getSavingsTransfers());

  const reloadAll = useCallback(() => {
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    setCategories(getCategories());
    setCashWallet(getCashWallet());
    setSavingsGoals(getSavingsGoals());
    setSavingsTransfers(getSavingsTransfers());
  }, []);

  // Reload user data when currentUser session changes
  useEffect(() => {
    reloadAll();
  }, [currentUser, reloadAll]);

  const logout = useCallback(async () => {
    await flushSync(); // make sure the last changes reach the server first
    setSyncEnabled(false);
    setToken(null);
    setCurrentUserStorage(null);
    setCurrentUser(null);
  }, []);

  // Fetch the latest copy from the server. If the server has nothing for this
  // account yet (e.g. an account that only existed in this browser), upload what is here.
  const pullFromServer = useCallback(async () => {
    if (!getToken()) return;
    try {
      // Local changes that haven't reached the server yet go up first, never get overwritten
      if (hasPendingSync()) {
        await flushSync();
        return;
      }
      const { data } = await api('/api/data');
      if (hydrateFromServer(data)) reloadAll();
      else await pushLocalToServer();
      setSyncEnabled(true);
    } catch (err) {
      if (err.status === 401) logout();
    }
  }, [reloadAll, logout]);

  // Stay in sync with other devices: pull on load and whenever the tab comes back into view
  useEffect(() => {
    if (!currentUser) return undefined;
    pullFromServer();
    const onVisible = () => {
      if (document.visibilityState === 'visible') pullFromServer();
      else flushSync({ keepalive: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pagehide', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onVisible);
    };
  }, [currentUser, pullFromServer]);

  const signIn = useCallback(async (path, username, password) => {
    let result;
    try {
      result = await api(path, { method: 'POST', body: { username, password } });
    } catch (err) {
      // Accounts made before cloud sync only exist in this browser
      const typed = username.trim().toLowerCase();
      let local = [];
      try { local = JSON.parse(localStorage.getItem('hostelPay_users') || '[]'); } catch { /* ignore */ }
      if (path.endsWith('/login') && err.status === 404 && local.some((u) => u.username.toLowerCase() === typed)) {
        throw new Error('This account was saved only in this browser. Choose Sign Up with the same username to move it to the cloud. Your data comes with it.');
      }
      throw err;
    }
    const { token, username: name } = result;
    setSyncEnabled(false);
    setToken(token);
    setCurrentUserStorage(name);
    // Show this account's data immediately; the pull effect above refreshes it from the server
    setCurrentUser(name);
    return name;
  }, []);

  const login = useCallback((username, password) => signIn('/api/auth/login', username, password), [signIn]);
  const register = useCallback((username, password) => signIn('/api/auth/register', username, password), [signIn]);

  // ─── Account Actions ────────────────────────────────
  const addAccount = useCallback((account) => {
    setAccounts((prev) => {
      const next = [...prev, account];
      saveAccounts(next);
      return next;
    });
  }, []);

  const editAccount = useCallback((id, updates) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      saveAccounts(next);
      return next;
    });
  }, []);

  const removeAccount = useCallback((id) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAccounts(next);
      return next;
    });
  }, []);

  // ─── Transaction Actions ────────────────────────────
  const addTransaction = useCallback((transaction) => {
    setTransactions((prev) => {
      const next = [...prev, transaction];
      saveTransactions(next);
      return next;
    });

    // Update account or cash balance
    if (transaction.paymentType === 'online' && transaction.accountId) {
      setAccounts((prev) => {
        const next = prev.map((a) =>
          a.id === transaction.accountId
            ? { ...a, balance: a.balance - Number(transaction.amount) }
            : a
        );
        saveAccounts(next);
        return next;
      });
    } else if (transaction.paymentType === 'cash') {
      setCashWallet((prev) => {
        const next = { ...prev, balance: prev.balance - Number(transaction.amount), lastUpdated: new Date().toISOString() };
        saveCashWallet(next);
        return next;
      });
    }
  }, []);

  const removeTransaction = useCallback((id) => {
    setTransactions((prev) => {
      const tx = prev.find((t) => t.id === id);
      if (tx) {
        // Refund balance
        if (tx.paymentType === 'online' && tx.accountId) {
          setAccounts((prevAccs) => {
            const next = prevAccs.map((a) =>
              a.id === tx.accountId
                ? { ...a, balance: a.balance + Number(tx.amount) }
                : a
            );
            saveAccounts(next);
            return next;
          });
        } else if (tx.paymentType === 'cash') {
          setCashWallet((prevW) => {
            const next = { ...prevW, balance: prevW.balance + Number(tx.amount), lastUpdated: new Date().toISOString() };
            saveCashWallet(next);
            return next;
          });
        }
      }
      const next = prev.filter((t) => t.id !== id);
      saveTransactions(next);
      return next;
    });
  }, []);

  // ─── Category Actions ──────────────────────────────
  const addCategory = useCallback((category) => {
    setCategories((prev) => {
      const next = [...prev, category];
      saveCategories(next);
      return next;
    });
  }, []);

  const editCategory = useCallback((id, updates) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveCategories(next);
      return next;
    });
  }, []);

  const removeCategory = useCallback((id) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveCategories(next);
      return next;
    });
  }, []);

  // ─── Cash Wallet Actions ───────────────────────────
  const updateCash = useCallback((amount) => {
    setCashWallet((prev) => {
      const next = { balance: prev.balance + amount, lastUpdated: new Date().toISOString() };
      saveCashWallet(next);
      return next;
    });
  }, []);

  // ─── Savings Actions ───────────────────────────────
  const addSavingsGoal = useCallback((goal) => {
    setSavingsGoals((prev) => {
      const next = [...prev, goal];
      saveSavingsGoals(next);
      return next;
    });
  }, []);

  const editSavingsGoal = useCallback((id, updates) => {
    setSavingsGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      saveSavingsGoals(next);
      return next;
    });
  }, []);

  const removeSavingsGoal = useCallback((id) => {
    setSavingsGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveSavingsGoals(next);
      return next;
    });
  }, []);

  const depositToGoal = useCallback((goalId, amount, sourceType, accountId) => {
    const amt = Number(amount);
    if (sourceType === 'online' && accountId) {
      setAccounts((prev) => {
        const next = prev.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance - amt } : a
        );
        saveAccounts(next);
        return next;
      });
    } else if (sourceType === 'cash') {
      setCashWallet((prev) => {
        const next = { ...prev, balance: prev.balance - amt, lastUpdated: new Date().toISOString() };
        saveCashWallet(next);
        return next;
      });
    }

    setSavingsGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount + amt } : g
      );
      saveSavingsGoals(next);
      return next;
    });

    setSavingsTransfers((prev) => {
      const transfer = {
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        goalId,
        type: 'deposit',
        amount: amt,
        sourceType,
        accountId: sourceType === 'online' ? accountId : null,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      const next = [...prev, transfer];
      saveSavingsTransfers(next);
      return next;
    });
  }, []);

  const withdrawFromGoal = useCallback((goalId, amount, destinationType, accountId) => {
    const amt = Number(amount);
    if (destinationType === 'online' && accountId) {
      setAccounts((prev) => {
        const next = prev.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance + amt } : a
        );
        saveAccounts(next);
        return next;
      });
    } else if (destinationType === 'cash') {
      setCashWallet((prev) => {
        const next = { ...prev, balance: prev.balance + amt, lastUpdated: new Date().toISOString() };
        saveCashWallet(next);
        return next;
      });
    }

    setSavingsGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId ? { ...g, currentAmount: g.currentAmount - amt } : g
      );
      saveSavingsGoals(next);
      return next;
    });

    setSavingsTransfers((prev) => {
      const transfer = {
        id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        goalId,
        type: 'withdrawal',
        amount: amt,
        sourceType: destinationType,
        accountId: destinationType === 'online' ? accountId : null,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      const next = [...prev, transfer];
      saveSavingsTransfers(next);
      return next;
    });
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    accounts,
    transactions,
    categories,
    cashWallet,
    savingsGoals,
    savingsTransfers,
    addAccount,
    editAccount,
    removeAccount,
    addTransaction,
    removeTransaction,
    addCategory,
    editCategory,
    removeCategory,
    updateCash,
    addSavingsGoal,
    editSavingsGoal,
    removeSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
