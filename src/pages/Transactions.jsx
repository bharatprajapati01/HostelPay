import { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMonthTransactions, formatCurrency } from '../utils/helpers';
import MonthPicker from '../components/MonthPicker';
import TransactionRow from '../components/TransactionRow';
import AddTransaction from '../components/AddTransaction';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Transactions() {
  const { transactions, categories, accounts, removeTransaction } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const monthTxs = useMemo(() => {
    let txs = getMonthTransactions(year, month);

    if (filterCategory !== 'all') {
      txs = txs.filter((t) => t.category === filterCategory);
    }
    if (filterPayment !== 'all') {
      txs = txs.filter((t) => t.paymentType === filterPayment);
    }
    if (filterAccount !== 'all') {
      txs = txs.filter((t) => t.accountId === filterAccount);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter((t) => t.description.toLowerCase().includes(q));
    }

    return txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, year, month, filterCategory, filterPayment, filterAccount, searchQuery]);

  const total = monthTxs.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{monthTxs.length} transactions • Total: {formatCurrency(total)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <MonthPicker
        year={year}
        month={month}
        onChange={(y, m) => { setYear(y); setMonth(m); }}
      />

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="all">All Payments</option>
          <option value="online">Online</option>
          <option value="cash">Cash</option>
        </select>

        {accounts.length > 0 && (
          <select
            className="form-select"
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.nickname}</option>
            ))}
          </select>
        )}
      </div>

      {/* Transaction List */}
      <div className="glass-card">
        {monthTxs.length > 0 ? (
          <div className="transaction-list">
            {monthTxs.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No transactions found</p>
            <p className="empty-state-text">
              {searchQuery || filterCategory !== 'all' || filterPayment !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first expense for this month'}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)} title="Add Expense">
        <Plus />
      </button>

      {/* Modals */}
      {showAdd && <AddTransaction onClose={() => setShowAdd(false)} />}
      {deleteId && (
        <ConfirmDialog
          title="Delete Transaction?"
          message="This will permanently remove this transaction and refund the balance."
          onConfirm={() => {
            removeTransaction(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
