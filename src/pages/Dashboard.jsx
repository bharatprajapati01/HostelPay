import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  IndianRupee, TrendingDown, CreditCard, Banknote,
  ArrowRight, Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getMonthSummary, getLastNMonths, CHART_COLORS } from '../utils/helpers';
import StatCard from '../components/StatCard';
import TransactionRow from '../components/TransactionRow';
import AddTransaction from '../components/AddTransaction';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Dashboard() {
  const { transactions, categories, accounts, cashWallet, removeTransaction } = useApp();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const summary = useMemo(() => getMonthSummary(year, month), [transactions, year, month]);

  // Pie chart data
  const pieData = useMemo(() => {
    return Object.entries(summary.byCategory).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        name: cat?.name || 'Other',
        value: amount,
        color: cat?.color || '#6b7280',
      };
    });
  }, [summary, categories]);

  // Bar chart — last 6 months
  const barData = useMemo(() => {
    return getLastNMonths(6).map((m) => {
      const s = getMonthSummary(m.year, m.month);
      return {
        name: m.shortLabel,
        amount: s.totalSpent,
      };
    });
  }, [transactions]);

  // Recent transactions (last 8)
  const recentTxs = useMemo(() => {
    return [...summary.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [summary]);

  // Total account balances
  const totalBankBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Overview for {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid stagger-children">
        <StatCard
          icon={<TrendingDown size={20} />}
          label="Total Spent"
          value={formatCurrency(summary.totalSpent)}
          change={`${summary.transactionCount} transactions`}
          color="#ef4444"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Online Payments"
          value={formatCurrency(summary.byPaymentType.online)}
          color="#00d4aa"
        />
        <StatCard
          icon={<Banknote size={20} />}
          label="Cash Payments"
          value={formatCurrency(summary.byPaymentType.cash)}
          color="#f59e0b"
        />
        <StatCard
          icon={<IndianRupee size={20} />}
          label="Total Balance"
          value={formatCurrency(totalBankBalance + cashWallet.balance)}
          change={`Banks: ${formatCurrency(totalBankBalance)} • Cash: ${formatCurrency(cashWallet.balance)}`}
          color="#7c3aed"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card animate-slide-up">
          <h3 className="chart-card-title">Spending by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="empty-state-text">No expenses this month yet</p>
            </div>
          )}
        </div>

        <div className="chart-card animate-slide-up">
          <h3 className="chart-card-title">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4aa" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card animate-slide-up">
        <div className="section-header">
          <h3 className="section-title">Recent Transactions</h3>
          <span className="section-link" onClick={() => navigate('/transactions')}>
            View all <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
          </span>
        </div>

        {recentTxs.length > 0 ? (
          <div className="transaction-list">
            {recentTxs.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No transactions yet</p>
            <p className="empty-state-text">
              Start by adding your first expense for this month
            </p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Expense
            </button>
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
