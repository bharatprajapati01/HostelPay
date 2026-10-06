import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock, ArrowRight, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMonthSummary, getLastNMonths, formatCurrency, getActiveMonths } from '../utils/helpers';

export default function History() {
  const { transactions } = useApp();
  const navigate = useNavigate();

  // Bar chart — last 12 months
  const barData = useMemo(() => {
    return getLastNMonths(12).map((m) => {
      const s = getMonthSummary(m.year, m.month);
      return {
        name: m.shortLabel,
        fullLabel: m.label,
        amount: s.totalSpent,
        count: s.transactionCount,
        year: m.year,
        month: m.month,
      };
    });
  }, [transactions]);

  // Active months with summaries
  const monthCards = useMemo(() => {
    const months = getActiveMonths();
    return months.map((m) => {
      const s = getMonthSummary(m.year, m.month);
      return { ...m, ...s };
    });
  }, [transactions]);

  // Average monthly
  const avgMonthly = useMemo(() => {
    const withData = barData.filter((d) => d.amount > 0);
    if (withData.length === 0) return 0;
    return withData.reduce((s, d) => s + d.amount, 0) / withData.length;
  }, [barData]);

  const goToMonth = (year, month) => {
    navigate(`/transactions?year=${year}&month=${month}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">Review your past monthly expenses</p>
      </div>

      {/* Summary stat */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card animate-slide-up">
          <div className="stat-card-header">
            <span className="stat-card-label">Avg. Monthly</span>
            <div className="stat-card-icon" style={{ background: 'var(--accent-violet-dim)', color: 'var(--accent-violet)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(avgMonthly)}</div>
          <span className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
            Based on last 12 months
          </span>
        </div>
      </div>

      {/* 12-Month Bar Chart */}
      <div className="chart-card animate-slide-up" style={{ marginBottom: 28 }}>
        <h3 className="chart-card-title">Last 12 Months</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,17,40,0.08)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) return payload[0].payload.fullLabel;
                return label;
              }}
              contentStyle={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}
            />
            <Bar dataKey="amount" fill="url(#histGradient)" radius={[6, 6, 0, 0]} />
            <defs>
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8f86ff" />
                <stop offset="100%" stopColor="#4b3bff" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month Cards */}
      {monthCards.length > 0 ? (
        <div className="history-grid stagger-children">
          {monthCards.map((m) => (
            <div
              key={`${m.year}-${m.month}`}
              className="history-card animate-slide-up"
              onClick={() => goToMonth(m.year, m.month)}
            >
              <div className="history-card-month">{m.label}</div>
              <div className="history-card-amount">{formatCurrency(m.totalSpent)}</div>
              <div className="history-card-meta">
                {m.transactionCount} transactions •
                Online: {formatCurrency(m.byPaymentType?.online || 0)} •
                Cash: {formatCurrency(m.byPaymentType?.cash || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clock size={28} />
            </div>
            <p className="empty-state-title">No history yet</p>
            <p className="empty-state-text">
              Your monthly expense history will appear here as you add transactions
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
