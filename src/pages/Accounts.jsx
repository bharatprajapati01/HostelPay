import { useState } from 'react';
import { Plus, Landmark, Banknote, Trash2, Pencil, X, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId, formatCurrency } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Accounts() {
  const { accounts, cashWallet, addAccount, editAccount, removeAccount, updateCash } = useApp();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({ bankName: '', nickname: '', balance: '' });
  const [cashAmount, setCashAmount] = useState('');
  const [cashAction, setCashAction] = useState('add');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAdd = () => {
    setForm({ bankName: '', nickname: '', balance: '' });
    setEditingId(null);
    setShowAddAccount(true);
  };

  const openEdit = (account) => {
    setForm({ bankName: account.bankName, nickname: account.nickname, balance: String(account.balance) });
    setEditingId(account.id);
    setShowAddAccount(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.bankName || !form.nickname) return;

    if (editingId) {
      editAccount(editingId, {
        bankName: form.bankName,
        nickname: form.nickname,
        balance: Number(form.balance) || 0,
      });
    } else {
      addAccount({
        id: generateId('acc'),
        bankName: form.bankName,
        nickname: form.nickname,
        balance: Number(form.balance) || 0,
        createdAt: new Date().toISOString(),
      });
    }
    setShowAddAccount(false);
  };

  const handleCashSubmit = (e) => {
    e.preventDefault();
    const amt = Number(cashAmount);
    if (!amt || amt <= 0) return;
    updateCash(cashAction === 'add' ? amt : -amt);
    setShowCashModal(false);
    setCashAmount('');
  };

  const gradients = [
    'linear-gradient(90deg, #00d4aa, #7c3aed)',
    'linear-gradient(90deg, #3b82f6, #06b6d4)',
    'linear-gradient(90deg, #ec4899, #f97316)',
    'linear-gradient(90deg, #8b5cf6, #d946ef)',
    'linear-gradient(90deg, #10b981, #3b82f6)',
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage your bank accounts & cash wallet</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div className="accounts-grid stagger-children">
        {/* Cash Wallet Card */}
        <div className="account-card cash-wallet-card animate-slide-up">
          <div className="account-card-gradient" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
          <div className="account-card-header">
            <div className="account-card-bank">
              <div className="account-card-bank-icon">
                <Banknote size={22} />
              </div>
              <div>
                <div className="account-card-bank-name">Cash Wallet</div>
                <div className="account-card-nickname">Offline payments</div>
              </div>
            </div>
          </div>
          <div className="account-card-balance-label">Available Cash</div>
          <div className="account-card-balance">{formatCurrency(cashWallet.balance)}</div>
          <div className="account-card-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => { setCashAction('add'); setShowCashModal(true); }}>
              <Plus size={14} /> Add Cash
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => { setCashAction('withdraw'); setShowCashModal(true); }}>
              <Wallet size={14} /> Withdraw
            </button>
          </div>
        </div>

        {/* Bank Account Cards */}
        {accounts.map((account, i) => (
          <div key={account.id} className="account-card animate-slide-up">
            <div className="account-card-gradient" style={{ background: gradients[i % gradients.length] }} />
            <div className="account-card-header">
              <div className="account-card-bank">
                <div className="account-card-bank-icon">
                  <Landmark size={22} />
                </div>
                <div>
                  <div className="account-card-bank-name">{account.bankName}</div>
                  <div className="account-card-nickname">{account.nickname}</div>
                </div>
              </div>
            </div>
            <div className="account-card-balance-label">Balance</div>
            <div className="account-card-balance">{formatCurrency(account.balance)}</div>
            <div className="account-card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(account)}>
                <Pencil size={14} /> Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(account.id)}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Landmark size={28} />
            </div>
            <p className="empty-state-title">No bank accounts yet</p>
            <p className="empty-state-text">Add your bank accounts to track online transactions</p>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Account
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Account Modal */}
      {showAddAccount && (
        <div className="modal-overlay" onClick={() => setShowAddAccount(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Account' : 'Add Account'}</h2>
              <button className="modal-close" onClick={() => setShowAddAccount(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    className="form-input"
                    type="text"
                    name="bankName"
                    placeholder="e.g., State Bank of India"
                    value={form.bankName}
                    onChange={handleChange}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Nickname</label>
                  <input
                    className="form-input"
                    type="text"
                    name="nickname"
                    placeholder="e.g., Savings Account"
                    value={form.nickname}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Balance (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    name="balance"
                    placeholder="0.00"
                    step="0.01"
                    value={form.balance}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAccount(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Modal */}
      {showCashModal && (
        <div className="modal-overlay" onClick={() => setShowCashModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">{cashAction === 'add' ? 'Add Cash' : 'Withdraw Cash'}</h2>
              <button className="modal-close" onClick={() => setShowCashModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCashSubmit}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
                  Current balance: {formatCurrency(cashWallet.balance)}
                </p>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCashModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {cashAction === 'add' ? 'Add Cash' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmDialog
          title="Delete Account?"
          message="This will remove the account. Existing transactions linked to it will remain."
          onConfirm={() => {
            removeAccount(deleteId);
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
