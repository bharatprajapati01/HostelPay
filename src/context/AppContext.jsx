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
  getUsers,
  saveUsers,
  getCurrentUserStorage,
  setCurrentUserStorage,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUserStorage());
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [transactions, setTransactions] = useState(() => getTransactions());
  const [categories, setCategories] = useState(() => getCategories());
  const [cashWallet, setCashWallet] = useState(() => getCashWallet());
  const [savingsGoals, setSavingsGoals] = useState(() => getSavingsGoals());
  const [savingsTransfers, setSavingsTransfers] = useState(() => getSavingsTransfers());

  // Reload user data when currentUser session changes
  useEffect(() => {
    setAccounts(getAccounts());
    setTransactions(getTransactions());
    setCategories(getCategories());
    setCashWallet(getCashWallet());
    setSavingsGoals(getSavingsGoals());
    setSavingsTransfers(getSavingsTransfers());
  }, [currentUser]);

  const login = useCallback((username, password) => {
    const users = getUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error('User not found. Try creating an account!');
    }
    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }
    setCurrentUserStorage(user.username);
    setCurrentUser(user.username);
    return user.username;
  }, []);

  const register = useCallback((username, password) => {
    const trimmed = username ? username.trim() : '';
    if (!trimmed || trimmed.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!password || password.length < 3) {
      throw new Error('Password must be at least 3 characters long.');
    }
    const users = getUsers();
    const exists = users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      throw new Error('Username already exists. Choose a different one.');
    }
    const newUser = { username: trimmed, password };
    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);
    
    setCurrentUserStorage(newUser.username);
    setCurrentUser(newUser.username);
    return newUser.username;
  }, []);

  const logout = useCallback(() => {
    setCurrentUserStorage(null);
    setCurrentUser(null);
  }, []);

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
