import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId, getTodayString } from '../utils/helpers';

export default function AddTransaction({ onClose }) {
  const { categories, accounts, addTransaction } = useApp();
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: categories[0]?.id || '',
    paymentType: 'online',
    accountId: accounts[0]?.id || '',
    date: getTodayString(),
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || Number(form.amount) <= 0) return;

    const transaction = {
      id: generateId('tx'),
      description: form.description,
      amount: Number(form.amount),
      category: form.category,
      paymentType: form.paymentType,
      accountId: form.paymentType === 'online' ? form.accountId : null,
      date: form.date,
      createdAt: new Date().toISOString(),
    };

    addTransaction(transaction);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Expense</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                type="text"
                name="description"
                placeholder="e.g., Lunch at canteen"
                value={form.description}
                onChange={handleChange}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                name="amount"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Type</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${form.paymentType === 'online' ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, paymentType: 'online' }))}
                >
                  💳 Online
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${form.paymentType === 'cash' ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, paymentType: 'cash' }))}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            {form.paymentType === 'online' && (
              <div className="form-group">
                <label className="form-label">Bank Account</label>
                {accounts.length > 0 ? (
                  <select
                    className="form-select"
                    name="accountId"
                    value={form.accountId}
                    onChange={handleChange}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} — {acc.nickname}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    No bank accounts added yet. Go to Accounts to add one.
                  </p>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
